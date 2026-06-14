type FooterProps = {
  year?: number;
};

export function Footer({ year = 2024 }: FooterProps) {
  return (
    <footer className="flex w-full items-center justify-center bg-surface px-4 py-6 md:px-16">
      <p className="text-xs leading-4 text-foreground-muted">
        &copy; {year} Rajkiran Hospital. All rights reserved.
      </p>
    </footer>
  );
}
