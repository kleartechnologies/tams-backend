import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildBookingHTML, BookingPDFData, AgencyInfo } from './booking.template';
import { buildInvoiceHTML, InvoiceData, InvoiceAgencyInfo } from './invoice.template';

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  private async fetchBooking(bookingId: string, agencyId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, agencyId },
      include: {
        customer: true,
        package: {
          include: { itinerary: { orderBy: { dayNumber: 'asc' } } },
        },
        travelers: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { paymentDate: 'asc' } },
      },
    });
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    return booking;
  }

  private async fetchSettings(agencyId: string) {
    return this.prisma.agencySetting.findUnique({ where: { agencyId } });
  }

  private toNum(d: { toString(): string } | null | undefined): number {
    return d ? Number(d.toString()) : 0;
  }

  // ── Booking confirmation HTML ─────────────────────────────────────────────

  async getBookingHtml(bookingId: string, agencyId: string): Promise<string> {
    const [booking, settings] = await Promise.all([
      this.fetchBooking(bookingId, agencyId),
      this.fetchSettings(agencyId),
    ]);

    const agency: AgencyInfo = {
      name:                settings?.agencyName ?? 'TAMS',
      tag:                 settings?.agencyTag ?? 'Travel Agency Management System',
      primaryColor:        settings?.primaryColor ?? '#1F4E4A',
      logoUrl:             settings?.logoUrl ?? null,
      phone:               settings?.phone ?? undefined,
      email:               settings?.email ?? undefined,
      address:             settings?.address ?? undefined,
      motacLicenseNumber:  settings?.motacLicenseNumber ?? null,
      motacExpiryDate:     settings?.motacExpiryDate ?? null,
    };

    const inclusions = Array.isArray(booking.package.inclusions)
      ? (booking.package.inclusions as Array<{ type: string; value: string }>)
      : [];

    const data: BookingPDFData = {
      agency,
      bookingNumber: booking.bookingNumber ?? booking.id.slice(0, 8).toUpperCase(),
      bookingDate: booking.bookingDate,
      status: booking.status,
      departureDate: booking.departureDate,
      specialRequests: booking.specialRequests,
      customer: {
        fullName: booking.customer.fullName,
        phone: booking.customer.phone,
        email: booking.customer.email,
        icNumber: booking.customer.icNumber,
        passportNumber: booking.customer.passportNumber,
        nationality: booking.customer.nationality,
      },
      pkg: {
        name: booking.package.name,
        type: booking.package.type,
        destination: booking.package.destination,
        days: booking.package.days,
        nights: booking.package.nights,
        adultPrice: this.toNum(booking.package.adultPrice),
        childPrice: this.toNum(booking.package.childPrice),
        isSSTApplicable: booking.package.isSSTApplicable,
        sstRate: booking.package.sstRate,
        inclusions,
        itinerary: booking.package.itinerary.map((d) => ({
          dayNumber: d.dayNumber,
          title: d.title,
          description: d.description,
        })),
      },
      travelers: booking.travelers.map((t) => ({
        fullName: t.fullName,
        travelerType: t.travelerType,
        icNumber: t.icNumber,
        passportNumber: t.passportNumber,
        roomType: t.roomType,
        seatNumber: t.seatNumber,
        notes: t.notes,
        mahramRelation: t.mahramRelation,
      })),
      payments: booking.payments.map((p) => ({
        amount: this.toNum(p.amount),
        paymentType: p.paymentType,
        paymentMethod: p.paymentMethod,
        status: p.status,
        paymentDate: p.paymentDate,
        referenceNumber: p.referenceNumber,
      })),
    };

    return buildBookingHTML(data, settings?.pdfTemplate ?? 'modern');
  }

  // ── Invoice HTML ──────────────────────────────────────────────────────────

  async getInvoiceHtml(bookingId: string, agencyId: string): Promise<string> {
    const [booking, settings] = await Promise.all([
      this.fetchBooking(bookingId, agencyId),
      this.fetchSettings(agencyId),
    ]);

    const bookingNum = booking.bookingNumber ?? booking.id.slice(0, 8).toUpperCase();
    const invoiceNumber = bookingNum.startsWith('BKG-')
      ? bookingNum.replace(/^BKG-/, 'INV-')
      : `INV-${bookingNum}`;

    const agency: InvoiceAgencyInfo = {
      name:                settings?.agencyName ?? 'TAMS',
      tag:                 settings?.agencyTag ?? 'Travel Agency Management System',
      logoUrl:             settings?.logoUrl ?? null,
      address:             settings?.address ?? null,
      phone:               settings?.phone ?? null,
      email:               settings?.email ?? null,
      primaryColor:        settings?.primaryColor ?? '#1F4E4A',
      bankName:            settings?.bankName ?? null,
      bankAccountNumber:   settings?.bankAccountNumber ?? null,
      bankAccountHolder:   settings?.bankAccountHolder ?? null,
      bankNotes:           settings?.bankNotes ?? null,
      termsAndConditions:  settings?.termsAndConditions ?? null,
      refundPolicy:        settings?.refundPolicy ?? null,
      motacLicenseNumber:  settings?.motacLicenseNumber ?? null,
      motacExpiryDate:     settings?.motacExpiryDate ?? null,
      sstEnabled:          settings?.sstEnabled ?? false,
      defaultSstRate:      settings?.defaultSstRate ?? 6,
    };

    const data: InvoiceData = {
      agency,
      invoiceNumber,
      invoiceDate: new Date(),
      bookingNumber: bookingNum,
      bookingDate: booking.bookingDate,
      status: booking.status,
      departureDate: booking.departureDate,
      specialRequests: booking.specialRequests,
      customer: {
        fullName: booking.customer.fullName,
        phone: booking.customer.phone,
        email: booking.customer.email,
        icNumber: booking.customer.icNumber,
        passportNumber: booking.customer.passportNumber,
        nationality: booking.customer.nationality,
      },
      pkg: {
        name: booking.package.name,
        type: booking.package.type,
        destination: booking.package.destination,
        days: booking.package.days,
        nights: booking.package.nights,
        adultPrice: this.toNum(booking.package.adultPrice),
        childPrice: this.toNum(booking.package.childPrice),
        isSSTApplicable: booking.package.isSSTApplicable,
        sstRate: booking.package.sstRate,
      },
      travelers: booking.travelers.map((t) => ({
        fullName: t.fullName,
        travelerType: t.travelerType,
      })),
      payments: booking.payments.map((p) => ({
        amount: this.toNum(p.amount),
        paymentType: p.paymentType,
        paymentMethod: p.paymentMethod,
        status: p.status,
        paymentDate: p.paymentDate,
        referenceNumber: p.referenceNumber,
      })),
    };

    return buildInvoiceHTML(data, settings?.pdfTemplate ?? 'modern');
  }
}
