
export const commonSuffixes = [
    { suffix: "Director", level: "Manager" },
    { suffix: "Manager", level: "Manager" },
    { suffix: "Team Lead", level: "Manager" },
    { suffix: "Supervisor", level: "Manager" },
    { suffix: "Senior Specialist", level: "Staff" },
    { suffix: "Specialist", level: "Staff" },
    { suffix: "Senior Officer", level: "Staff" },
    { suffix: "Officer", level: "Staff" },
    { suffix: "Senior Staff", level: "Staff" },
    { suffix: "Staff", level: "Staff" },
    { suffix: "Associate", level: "Staff" },
    { suffix: "Coordinator", level: "Staff" },
    { suffix: "Administrator", level: "Staff" },
    { suffix: "Assistant", level: "Staff" },
    { suffix: "Intern", level: "Staff" },
];

// Special overrides for departments that need specific industry titles
export const specialDeptRoles: Record<string, Array<{ title: string, level: string }>> = {
    "Information Technology": [
        { title: "VP of Engineering", level: "Manager" },
        { title: "IT Manager", level: "Manager" },
        { title: "Tech Lead", level: "Manager" },
        { title: "Principal Software Engineer", level: "Staff" },
        { title: "Senior Software Engineer", level: "Staff" },
        { title: "Software Engineer", level: "Staff" },
        { title: "Junior Software Engineer", level: "Staff" },
        { title: "DevOps Engineer", level: "Staff" },
        { title: "QA Engineer", level: "Staff" },
        { title: "System Administrator", level: "Staff" },
        { title: "IT Support Specialist", level: "Staff" },
        { title: "Network Engineer", level: "Staff" },
        { title: "Data Scientist", level: "Staff" },
        { title: "UI/UX Designer", level: "Staff" },
        { title: "Product Manager", level: "Manager" }
    ],
    "Human Resources": [
        { title: "HR Director", level: "Manager" },
        { title: "HR Manager", level: "Manager" },
        { title: "Talent Acquisition Manager", level: "Manager" },
        { title: "Senior Recruiter", level: "Staff" },
        { title: "Recruiter", level: "Staff" },
        { title: "HR Business Partner", level: "Staff" },
        { title: "HR Generalist", level: "Staff" },
        { title: "Training Coordinator", level: "Staff" },
        { title: "Compensation & Benefits Specialist", level: "Staff" },
        { title: "HR Admin", level: "Staff" }
    ],
    "Sales": [
        { title: "Sales Director", level: "Manager" },
        { title: "Sales Manager", level: "Manager" },
        { title: "Regional Sales Manager", level: "Manager" },
        { title: "Account Executive", level: "Staff" },
        { title: "Senior Sales Representative", level: "Staff" },
        { title: "Sales Representative", level: "Staff" },
        { title: "Sales Development Rep", level: "Staff" },
        { title: "Sales Operations Analyst", level: "Staff" },
        { title: "Inside Sales Rep", level: "Staff" }
    ]
};

export function generateRolesForDept(deptName: string): Array<{ title: string, level: string }> {
    // Check for exact match or override
    if (specialDeptRoles[deptName]) {
        return specialDeptRoles[deptName];
    }

    // Default Generator: "[Dept Name] [Suffix]"
    // Example: "Accounting Manager", "Accounting Staff"
    return commonSuffixes.map(r => ({
        title: `${deptName} ${r.suffix}`,
        level: r.level
    }));
}
