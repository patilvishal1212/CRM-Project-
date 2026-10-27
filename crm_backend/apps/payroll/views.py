import io
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, Http404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.files.base import ContentFile

from .models import SalaryMaster, MonthlyPayroll
from .serializers import SalaryMasterSerializer, MonthlyPayrollSerializer

# ReportLab imports for generating true binary PDF stream
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class IsHRUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', ' ') == 'hr'

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', ' ') == 'admin'

class SalaryMasterListCreateView(generics.ListCreateAPIView):
    queryset = SalaryMaster.objects.all()
    serializer_class = SalaryMasterSerializer
    permission_classes = [IsHRUser | IsAdminUser]

    def create(self, request, *args, **kwargs):
        employee_id = request.data.get('employee')
        if not employee_id:
            return Response({"error": "Employee ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        master_obj, created = SalaryMaster.objects.update_or_create(
            employee_id=employee_id,
            defaults={
                'base_salary': request.data.get('base_salary', 0.00),
                'pf_deduction': request.data.get('pf_deduction', 0.00),
                'professional_tax': request.data.get('professional_tax', 0.00),
                'designation': request.data.get('designation', 'Specialist'),
                'gender_status': request.data.get('gender_status', 'Regular / Active'),
                'pan_number': request.data.get('pan_number', ''),
                'location': request.data.get('location', 'Mumbai HQ'),
                'uan_number': request.data.get('uan_number', ''),
                'esic_number': request.data.get('esic_number', ''),
                'bank_account': request.data.get('bank_account', ''),
                'bank_name': request.data.get('bank_name', ''),
            }
        )
        serializer = self.get_serializer(master_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class SalaryMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SalaryMaster.objects.all()
    serializer_class = SalaryMasterSerializer
    permission_classes = [IsHRUser | IsAdminUser]

class HRPayrollSubmissionView(generics.CreateAPIView):
    queryset = MonthlyPayroll.objects.all()
    serializer_class = MonthlyPayrollSerializer
    permission_classes = [IsHRUser]

    def perform_create(self, serializer):
        serializer.save(processed_by_hr=self.request.user, status='pending_review')

class MonthlyPayrollDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MonthlyPayroll.objects.all()
    serializer_class = MonthlyPayrollSerializer
    permission_classes = [IsHRUser | IsAdminUser]

class MonthlyPayrollListView(generics.ListAPIView):
    serializer_class = MonthlyPayrollSerializer
    permission_classes = [IsHRUser | IsAdminUser]

    def get_queryset(self):
        qs = MonthlyPayroll.objects.all()
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month:
            qs = qs.filter(month=month)
        if year:
            qs = qs.filter(year=year)
        return qs

def number_to_words_indian(num):
    if not num or num <= 0:
        return "Zero Rupees Only"
    n = int(round(num))
    a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen ']
    b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    def in_words(n_val):
        if n_val == 0:
            return ""
        if n_val < 20:
            return a[n_val]
        if n_val < 100:
            return b[n_val // 10] + (" " + a[n_val % 10] if n_val % 10 != 0 else "")
        if n_val < 1000:
            return a[n_val // 100] + "Hundred " + (("and " if n_val % 100 != 0 else "") + in_words(n_val % 100))
        if n_val < 100000:
            return in_words(n_val // 1000) + "Thousand " + in_words(n_val % 1000)
        if n_val < 10000000:
            return in_words(n_val // 100000) + "Lakh " + in_words(n_val % 100000)
        return in_words(n_val // 10000000) + "Crore " + in_words(n_val % 10000000)

    words = in_words(n).strip()
    return (words if words else "Zero") + " Rupees Only"


def get_month_name(month_num):
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    try:
        return months[(int(month_num) - 1) % 12]
    except Exception:
        return 'July'


def generate_payroll_pdf_binary(record):
    """Generates a genuine binary PDF stream matching SalarySlipModal.jsx 1:1."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    styles = getSampleStyleSheet()
    story = []

    # Custom typography styles
    header_title_style = ParagraphStyle(
        'CompanyTitle',
        parent=styles['Heading1'],
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#B45309'),  # Corporate amber/gold
        fontName='Helvetica-Bold'
    )
    header_sub_style = ParagraphStyle(
        'CompanySub',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )
    header_addr_style = ParagraphStyle(
        'CompanyAddr',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155'),
        fontName='Helvetica'
    )
    doc_right_hdr = ParagraphStyle(
        'DocRightHdr',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        alignment=2,  # Right align
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )

    cell_label_style = ParagraphStyle('CellLabel', parent=styles['Normal'], fontSize=8.5, leading=11, textColor=colors.HexColor('#000000'), fontName='Helvetica-Bold')
    cell_val_style = ParagraphStyle('CellVal', parent=styles['Normal'], fontSize=8.5, leading=11, textColor=colors.HexColor('#0F172A'), fontName='Helvetica')
    cell_val_bold = ParagraphStyle('CellValBold', parent=styles['Normal'], fontSize=8.5, leading=11, textColor=colors.HexColor('#0F172A'), fontName='Helvetica-Bold')

    # Data Extract
    master = getattr(record.employee, 'salary_master', None)
    month_name = get_month_name(record.month)
    year = int(record.year) if record.year else 2026
    financial_period = f"{year}-{(year + 1) % 100:02d}"

    emp_id = f"EMP-{(record.employee.id if record.employee else 100):04d}"
    emp_name = record.employee.full_name if (record.employee and record.employee.full_name) else (record.employee.email.split('@')[0].upper() if record.employee else 'Employee Name')
    designation = master.designation if (master and master.designation) else 'Specialist'
    gender_status = master.gender_status if (master and master.gender_status) else 'Regular / Active'
    joining_date = getattr(master, 'joining_date', '15-Mar-2023') if master else '15-Mar-2023'
    bank_acc = master.bank_account if (master and master.bank_account) else 'XXXX-XXXX-8921'
    bank_name = master.bank_name if (master and master.bank_name) else 'HDFC Bank Ltd'
    pan = master.pan_number if (master and master.pan_number) else 'ABCDE1234F'
    location = master.location if (master and master.location) else 'Mumbai HQ'
    uan = master.uan_number if (master and master.uan_number) else '101293847561'
    esic = master.esic_number if (master and master.esic_number) else '31-00-123456-000-0001'

    gross_pay = float(record.gross_earnings or 0.0)
    incentives = float(record.incentives or 0.0)
    perf_allowance = float(record.performance_allowance or 0.0)
    base_sal = float(master.base_salary) if master else max(0.0, gross_pay - incentives - perf_allowance)

    pf_ded = float(master.pf_deduction) if master else 1800.0
    pt_tax = float(master.professional_tax) if master else 200.0

    unpaid_leaves_count = float(record.unpaid_leaves or 0)
    half_day_count = float(record.half_day_leaves or 0)
    daily_rate = base_sal / 30.0 if base_sal else 0.0
    unpaid_deduction = round(unpaid_leaves_count * daily_rate)
    half_day_deduction = round(half_day_count * 0.5 * daily_rate)

    total_deductions = float(record.total_deductions or (pf_ded + pt_tax + unpaid_deduction + half_day_deduction))
    net_payable = float(record.net_salary_payable or (gross_pay - total_deductions))
    days_worked = max(0.0, 30.0 - unpaid_leaves_count - (half_day_count * 0.5))

    # --- 1. COMPANY HEADER ---
    left_header = [
        Paragraph("<b>ProEdge Media Solutions Pvt Ltd</b>", header_title_style),
        Paragraph("Proedge CRM Operations & Enterprise Technology Hub", header_sub_style),
        Paragraph("Divine Coworking Space S.No :82, Suman Ankur, Sahyadri Farms, Lalit Estate,<br/>Baner, Pune, Maharashtra 411045", header_addr_style)
    ]
    right_header = [
        Paragraph(f"<font color='#1E293B'><b>Financial Period {financial_period}</b></font>", doc_right_hdr),
        Spacer(1, 4),
        Paragraph(f"<font color='#312E81'><b>PAY SLIP FOR THE MONTH OF {month_name.upper()} {year}</b></font>", doc_right_hdr),
        Paragraph(f"<font color='#475569'>Ref Doc: PAY-{year}{int(record.month):02d}-{emp_id}</font>", doc_right_hdr)
    ]
    hdr_table = Table([[left_header, right_header]], colWidths=[330, 205])
    hdr_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.HexColor('#0F172A')),
    ]))
    story.append(hdr_table)
    story.append(Spacer(1, 10))

    # --- 2. ASSOCIATE IDENTIFICATION & BANKING PROFILE ---
    assoc_hdr = Table([[Paragraph("<b>ASSOCIATE IDENTIFICATION & BANKING PROFILE</b>", ParagraphStyle('AssocHdr', parent=styles['Normal'], fontSize=9, leading=11, fontName='Helvetica-Bold', textColor=colors.HexColor('#1E293B')))]], colWidths=[535])
    assoc_hdr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(assoc_hdr)

    left_assoc_data = [
        [Paragraph("Employee ID:", cell_label_style), Paragraph(emp_id, cell_val_bold)],
        [Paragraph("Employee Name:", cell_label_style), Paragraph(emp_name, cell_val_bold)],
        [Paragraph("Date of Joining:", cell_label_style), Paragraph(str(joining_date), cell_val_style)],
        [Paragraph("Payable Days:", cell_label_style), Paragraph("30 Days", cell_val_bold)],
        [Paragraph("Days Worked:", cell_label_style), Paragraph(f"{days_worked:.1f} Days", ParagraphStyle('GreenVal', parent=cell_val_bold, textColor=colors.HexColor('#047857')))],
        [Paragraph("Bank A/C Number:", cell_label_style), Paragraph(bank_acc, cell_val_bold)],
        [Paragraph("Bank Name:", cell_label_style), Paragraph(bank_name, cell_val_style)],
    ]
    right_assoc_data = [
        [Paragraph("Designation:", cell_label_style), Paragraph(designation, cell_val_bold)],
        [Paragraph("Gender / Status:", cell_label_style), Paragraph(gender_status, cell_val_style)],
        [Paragraph("PAN Number:", cell_label_style), Paragraph(pan, cell_val_bold)],
        [Paragraph("Workplace Location:", cell_label_style), Paragraph(location, cell_val_style)],
        [Paragraph("UAN Number:", cell_label_style), Paragraph(uan, cell_val_style)],
        [Paragraph("ESIC Number:", cell_label_style), Paragraph(esic, cell_val_style)],
        [Paragraph("", cell_label_style), Paragraph("", cell_val_style)],
    ]

    t_left = Table(left_assoc_data, colWidths=[110, 150])
    t_right = Table(right_assoc_data, colWidths=[110, 150])
    t_left.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('BOTTOMPADDING', (0,0), (-1,-1), 3), ('TOPPADDING', (0,0), (-1,-1), 3)]))
    t_right.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('BOTTOMPADDING', (0,0), (-1,-1), 3), ('TOPPADDING', (0,0), (-1,-1), 3)]))

    grid_assoc = Table([[t_left, t_right]], colWidths=[267, 268])
    grid_assoc.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(grid_assoc)
    story.append(Spacer(1, 10))

    # --- 3. NO-HRA BREAKDOWN MATRIX ---
    matrix_hdr = Table([[
        Paragraph("<b>EARNINGS MATRIX (A)</b>", ParagraphStyle('EarnHdr', parent=styles['Normal'], fontSize=9, leading=11, fontName='Helvetica-Bold', textColor=colors.HexColor('#312E81'), alignment=1)),
        Paragraph("<b>DEDUCTIONS LEDGER (B)</b>", ParagraphStyle('DedHdr', parent=styles['Normal'], fontSize=9, leading=11, fontName='Helvetica-Bold', textColor=colors.HexColor('#881337'), alignment=1))
    ]], colWidths=[267, 268])
    matrix_hdr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#FFF1F2')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(matrix_hdr)

    # Earnings rows
    earn_rows = [
        [Paragraph("Basic Salary", cell_val_style), Paragraph(f"₹{base_sal:,.2f}", cell_val_bold)],
        [Paragraph("Incentives & Campaign Bonus", cell_val_style), Paragraph(f"+ ₹{incentives:,.2f}", ParagraphStyle('Grn', parent=cell_val_bold, textColor=colors.HexColor('#047857')))],
        [Paragraph("Performance Allowance", cell_val_style), Paragraph(f"+ ₹{perf_allowance:,.2f}", ParagraphStyle('Grn2', parent=cell_val_bold, textColor=colors.HexColor('#047857')))],
    ]
    ded_rows = [
        [Paragraph("Provident Fund (Employee PF)", cell_val_style), Paragraph(f"₹{pf_ded:,.2f}", cell_val_bold)],
        [Paragraph("Professional Tax (PT)", cell_val_style), Paragraph(f"₹{pt_tax:,.2f}", cell_val_bold)],
    ]
    if unpaid_leaves_count > 0:
        ded_rows.append([Paragraph(f"Unpaid Leaves Deduction ({int(unpaid_leaves_count)}d)", cell_val_style), Paragraph(f"₹{unpaid_deduction:,.2f}", ParagraphStyle('Red1', parent=cell_val_bold, textColor=colors.HexColor('#E11D48')))])
    if half_day_count > 0:
        ded_rows.append([Paragraph(f"Half Day Deduction ({int(half_day_count)}d)", cell_val_style), Paragraph(f"₹{half_day_deduction:,.2f}", ParagraphStyle('Red2', parent=cell_val_bold, textColor=colors.HexColor('#E11D48')))])
    if unpaid_leaves_count == 0 and half_day_count == 0:
        ded_rows.append([Paragraph("Attendance Loss Deduction", cell_val_style), Paragraph("₹0.00", cell_val_bold)])

    t_earn = Table(earn_rows, colWidths=[150, 100])
    t_ded = Table(ded_rows, colWidths=[150, 100])
    t_earn.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('BOTTOMPADDING', (0,0), (-1,-1), 4), ('TOPPADDING', (0,0), (-1,-1), 4)]))
    t_ded.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('BOTTOMPADDING', (0,0), (-1,-1), 4), ('TOPPADDING', (0,0), (-1,-1), 4)]))

    # Strip totals
    earn_tot = Table([[Paragraph("<b>GROSS EARNINGS (A)</b>", ParagraphStyle('GT', parent=styles['Normal'], fontSize=8, fontName='Helvetica-Bold', textColor=colors.HexColor('#064E3B'))), Paragraph(f"<b>₹{gross_pay:,.2f}</b>", ParagraphStyle('GTVal', parent=styles['Normal'], fontSize=9, fontName='Helvetica-Bold', textColor=colors.HexColor('#064E3B'), alignment=2))]], colWidths=[150, 100])
    earn_tot.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#D1FAE5')), ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4)]))

    ded_tot = Table([[Paragraph("<b>TOTAL DEDUCTIONS (B)</b>", ParagraphStyle('DT', parent=styles['Normal'], fontSize=8, fontName='Helvetica-Bold', textColor=colors.HexColor('#881337'))), Paragraph(f"<b>₹{total_deductions:,.2f}</b>", ParagraphStyle('DTVal', parent=styles['Normal'], fontSize=9, fontName='Helvetica-Bold', textColor=colors.HexColor('#881337'), alignment=2))]], colWidths=[150, 100])
    ded_tot.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEE2E2')), ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4)]))

    matrix_body = Table([[
        [t_earn, Spacer(1, 6), earn_tot],
        [t_ded, Spacer(1, 6), ded_tot]
    ]], colWidths=[267, 268])
    matrix_body.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(matrix_body)
    story.append(Spacer(1, 10))

    # --- 4. NET BANNER PAYABLE CARD ---
    in_words_str = number_to_words_indian(net_payable)
    net_left = [
        Paragraph("<b>NET SALARY PAYABLE (A - B)</b>", ParagraphStyle('NetL1', parent=styles['Normal'], fontSize=9, fontName='Helvetica-Bold', textColor=colors.HexColor('#0F172A'))),
        Spacer(1, 2),
        Paragraph(f"Amount in Words: <b><font color='#000000'>{in_words_str.upper()}</font></b>", ParagraphStyle('NetL2', parent=styles['Normal'], fontSize=8, fontName='Helvetica', textColor=colors.HexColor('#4F46E5')))
    ]
    net_right = [
        Paragraph(f"<b>₹{net_payable:,.2f}</b>", ParagraphStyle('NetR1', parent=styles['Normal'], fontSize=16, fontName='Helvetica-Bold', textColor=colors.HexColor('#059669'), alignment=2)),
        Paragraph("DIRECT DEPOSIT CONFIRMED", ParagraphStyle('NetR2', parent=styles['Normal'], fontSize=7.5, fontName='Helvetica-Bold', textColor=colors.HexColor('#000000'), alignment=2))
    ]
    net_table = Table([[net_left, net_right]], colWidths=[360, 175])
    net_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(net_table)
    story.append(Spacer(1, 15))

    # --- 5. CORPORATE SIGNATURE & DISCLAIMER ---
    disc_text = [
        Paragraph("<b>Authorised Signatory Notes:</b>", ParagraphStyle('NotesHdr', parent=styles['Normal'], fontSize=8, fontName='Helvetica-Bold', textColor=colors.HexColor('#000000'))),
        Paragraph("1. This document is a computer-generated salary advice statement issued by Proedge CRM Payroll Operations.", ParagraphStyle('N1', parent=styles['Normal'], fontSize=7.5, fontName='Helvetica', textColor=colors.HexColor('#000000'))),
        Paragraph("2. Any discrepancy must be reported to hr@proedgemedia.com within 5 working days.", ParagraphStyle('N2', parent=styles['Normal'], fontSize=7.5, fontName='Helvetica', textColor=colors.HexColor('#000000'))),
    ]
    sign_text = [
        Paragraph("<b><font color='#312E81'>PROEDGE PAYROLL</font></b>", ParagraphStyle('SignB1', parent=styles['Normal'], fontSize=8, fontName='Helvetica-Bold', alignment=2)),
        Spacer(1, 4),
        Paragraph("<b>AUTHORISED OFFICER</b>", ParagraphStyle('SignB2', parent=styles['Normal'], fontSize=8, fontName='Helvetica-Bold', textColor=colors.HexColor('#000000'), alignment=2)),
        Paragraph("Payroll & Benefits Dept", ParagraphStyle('SignB3', parent=styles['Normal'], fontSize=7.5, fontName='Helvetica', textColor=colors.HexColor('#000000'), alignment=2)),
    ]
    footer_table = Table([[disc_text, sign_text]], colWidths=[350, 185])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('LINEABOVE', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(footer_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

class AdminPayrollReviewView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        pending_records = MonthlyPayroll.objects.filter(status='pending_review')
        serializer = MonthlyPayrollSerializer(pending_records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        action = request.data.get('action')
        record = get_object_or_404(MonthlyPayroll, pk=pk)

        if action == 'approve':
            record.status = 'approved'
            record.approved_by_admin = request.user
            
            # Generate ReportLab binary PDF file
            pdf_bytes = generate_payroll_pdf_binary(record)
            file_name = f"slip_{record.employee.id}_{record.month}_{record.year}.pdf"
            record.pdf_slip.save(file_name, ContentFile(pdf_bytes))

            record.save()
            return Response({"message": "Payroll metric baseline confirmed. Slip published live successfully."}, status=status.HTTP_200_OK)

        elif action == 'rework': 
            record.status = 'rework'
            record.save()
            return Response({"message": "Record flagged and rejected back to HR terminal."}, status=status.HTTP_200_OK)   

        return Response({"error": "Invalid action context query."}, status=status.HTTP_400_BAD_REQUEST)  

class EmployeePayslipListView(generics.ListAPIView):
    serializer_class = MonthlyPayrollSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MonthlyPayroll.objects.filter(employee=self.request.user, status='approved').order_by('-year', '-month')


class DownloadPayslipView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        record = get_object_or_404(MonthlyPayroll, pk=pk)
        
        file_data = None
        if record.pdf_slip and hasattr(record.pdf_slip, 'storage') and record.pdf_slip.storage.exists(record.pdf_slip.name):
            file_data = record.pdf_slip.read()
        else:
            file_data = generate_payroll_pdf_binary(record)

        response = HttpResponse(file_data, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Salary_Slip_{record.month}_{record.year}.pdf"'
        return response


class DownloadPayslipFileView(APIView):
    """Secure pipeline that extracts the local PDF asset binary and forces download headers"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            # Scoped safety rule check: Admins/HR see all; Employees see only their own approved slips
            if getattr(request.user, 'role', '') in ['admin', 'hr']:
                record = MonthlyPayroll.objects.get(pk=pk, status='approved')
            else:
                record = MonthlyPayroll.objects.get(pk=pk, employee=request.user, status='approved')
        except MonthlyPayroll.DoesNotExist:
            raise Http404("Payroll record mapping database target instance not found.")

        if not record.pdf_slip:
            # Fallback to binary generation on the fly if file asset not saved yet
            pdf_bytes = generate_payroll_pdf_binary(record)
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Salary_Slip_{record.month}_{record.year}.pdf"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return response

        # Read raw binary chunks from PostgreSQL file field storage natively
        file_handle = record.pdf_slip.open('rb')
        response = HttpResponse(file_handle.read(), content_type='application/pdf')
        
        # CRITICAL FOR DIRECT DOWNLOAD: Inject attachment disposition header flag
        response['Content-Disposition'] = f'attachment; filename="Salary_Slip_{record.month}_{record.year}.pdf"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response



