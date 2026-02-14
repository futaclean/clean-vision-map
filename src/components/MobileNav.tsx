import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Scan } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileNavLink {
  label: string;
  to: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  isAnchor?: boolean;
}

interface MobileNavProps {
  links: MobileNavLink[];
  actions?: React.ReactNode;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { type: "spring" as const, damping: 30, stiffness: 300 } },
  exit: { x: "100%", transition: { type: "tween" as const, duration: 0.25 } },
};

const linkVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.08 * i, type: "tween" as const, duration: 0.25 },
  }),
};

export const MobileNav = ({ links, actions }: MobileNavProps) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-card border-l border-border/50 shadow-2xl flex flex-col"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-primary rounded-lg p-1.5 shadow-button">
                    <Scan className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-display font-bold text-foreground">Menu</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Links */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {links.map((link, i) => {
                  const isActive = location.pathname === link.to;

                  const content = (
                    <motion.div
                      key={link.to + link.label}
                      custom={i}
                      variants={linkVariants}
                      initial="hidden"
                      animate="visible"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary neon-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                      onClick={() => {
                        link.onClick?.();
                        setOpen(false);
                      }}
                    >
                      {link.icon}
                      {link.label}
                    </motion.div>
                  );

                  if (link.isAnchor) {
                    return (
                      <a key={link.to + link.label} href={link.to} onClick={() => setOpen(false)}>
                        {content}
                      </a>
                    );
                  }

                  return (
                    <Link key={link.to + link.label} to={link.to} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  );
                })}
              </nav>

              {/* Actions footer */}
              {actions && (
                <motion.div
                  className="p-4 border-t border-border/30 space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                >
                  {actions}
                </motion.div>
              )}

              {/* Decorative scan line */}
              <div className="absolute top-1/3 left-0 right-0 h-px bg-primary/10 animate-pulse pointer-events-none" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
