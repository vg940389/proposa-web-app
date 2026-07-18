import re

css_file = "src/styles/globals.css"
with open(css_file, "r") as f:
    content = f.read()

root_replacement = """:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --popover: #ffffff;
  --popover-foreground: #0f172a;
  --primary: #4f46e5;
  --primary-foreground: #ffffff;
  --secondary: #e0e7ff;
  --secondary-foreground: #3730a3;
  --muted: #f8fafc;
  --muted-foreground: #64748b;
  --accent: #e0e7ff;
  --accent-foreground: #3730a3;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #4f46e5;
  --chart-1: #4f46e5;
  --chart-2: #3b82f6;
  --chart-3: #10b981;
  --chart-4: #f59e0b;
  --chart-5: #ef4444;
  --radius: 0.75rem;
  --sidebar: #f8fafc;
  --sidebar-foreground: #0f172a;
  --sidebar-primary: #4f46e5;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #e0e7ff;
  --sidebar-accent-foreground: #3730a3;
  --sidebar-border: #e2e8f0;
  --sidebar-ring: #4f46e5;
}"""

dark_replacement = """.dark {
  --background: #020617;
  --foreground: #f8fafc;
  --card: #0f172a;
  --card-foreground: #f8fafc;
  --popover: #0f172a;
  --popover-foreground: #f8fafc;
  --primary: #6366f1;
  --primary-foreground: #ffffff;
  --secondary: #1e293b;
  --secondary-foreground: #f8fafc;
  --muted: #1e293b;
  --muted-foreground: #94a3b8;
  --accent: #1e293b;
  --accent-foreground: #f8fafc;
  --destructive: #7f1d1d;
  --destructive-foreground: #f8fafc;
  --border: #1e293b;
  --input: #1e293b;
  --ring: #6366f1;
  --chart-1: #6366f1;
  --chart-2: #3b82f6;
  --chart-3: #10b981;
  --chart-4: #f59e0b;
  --chart-5: #ef4444;
  --sidebar: #0f172a;
  --sidebar-foreground: #f8fafc;
  --sidebar-primary: #6366f1;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #1e293b;
  --sidebar-accent-foreground: #f8fafc;
  --sidebar-border: #1e293b;
  --sidebar-ring: #6366f1;
}"""

content = re.sub(r':root\s*\{[^}]*--sidebar-ring:[^}]*\}', root_replacement, content, count=1)
content = re.sub(r'\.dark\s*\{[^}]*--sidebar-ring:[^}]*\}', dark_replacement, content, count=1)

with open(css_file, "w") as f:
    f.write(content)

print("Colors updated")
