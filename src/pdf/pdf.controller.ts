import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './pdf.service';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('bookings')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get(':id/pdf')
  async getBookingPdf(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const html = await this.pdfService.getBookingHtml(id, user.agencyId!);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(html);
  }

  @Get(':id/invoice')
  async getInvoice(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const html = await this.pdfService.getInvoiceHtml(id, user.agencyId!);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(html);
  }
}
