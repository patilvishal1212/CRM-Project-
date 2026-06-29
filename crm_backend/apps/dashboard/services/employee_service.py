from apps.accounts.models import User
from apps.leads.models import Lead


class EmployeeService:

    @staticmethod
    def get_employees():

        employees = []

        queryset = User.objects.all().order_by(
            "-created_at"
        )

        for emp in queryset:

            employees.append({
                "id": emp.id,
                "full_name": emp.full_name,
                "email": emp.email,
                "username": emp.username,
                "role": emp.role,
                "is_active": emp.is_active,
                "created_at":
                    emp.created_at.isoformat(),
                "last_login":
                    emp.last_login.isoformat()
                    if emp.last_login
                    else None,
                "leads_count":
                    Lead.objects.filter(
                        assigned_to=emp
                    ).count(),
            })

        return employees

    @staticmethod
    def get_employee_performance():

        performance = []

        employees = User.objects.filter(
            role="employee",
            is_active=True
        )

        for emp in employees:

            emp_leads = Lead.objects.filter(
                assigned_to=emp
            )

            total = emp_leads.count()

            qualified = emp_leads.filter(
                qa_status="qualified"
            ).count()

            performance.append({
                "id": emp.id,
                "name": emp.full_name,
                "total_leads": total,
                "qualified_leads": qualified,
                "conversion_rate":
                    round(
                        qualified / total * 100,
                        1
                    ) if total else 0,
            })

        performance.sort(
            key=lambda x: x["total_leads"],
            reverse=True
        )

        return performance