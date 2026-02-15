import { Moon, Sun } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/use-theme";
import { cn } from "@/lib/utils";

function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/compose", label: "Compose" },
  { to: "/trash", label: "Trash" },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted">
      <nav className="sticky top-0 z-40 flex h-16 items-center bg-background shadow-sm">
        <div className="mx-auto flex w-full max-w-3xl items-center px-4">
          <div className="flex-1">
            <Link to="/" className="text-xl font-bold">
              Blissey
            </Link>
          </div>
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.to}
                variant="ghost"
                size="sm"
                className={cn(
                  "min-h-[44px] min-w-[44px]",
                  location.pathname === link.to && "bg-accent",
                )}
                asChild
              >
                <Link to={link.to}>{link.label}</Link>
              </Button>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
