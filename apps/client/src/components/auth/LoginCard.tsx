import React from "react";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardContent } from "../ui/Card";

const GOOGLE_START = "https://shpoint-prod.onrender.com/auth/google?returnTo=%2F";

const GoogleIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
    <path
      d="M21.35 11.1h-9.17v2.98h5.3c-.23 1.5-1.7 4.4-5.3 4.4-3.19 0-5.79-2.64-5.79-5.9s2.6-5.9 5.79-5.9c1.82 0 3.04.77 3.74 1.43l2.54-2.46C17.08 4.38 15.09 3.5 12.18 3.5 6.99 3.5 2.8 7.69 2.8 12.98s4.19 9.48 9.38 9.48c5.41 0 8.99-3.79 8.99-9.14 0-.62-.07-1.08-.17-1.72z"
      fill="currentColor"
    />
  </svg>
);

export function LoginCard() {
  return (
    <Card className="login-card">
      <CardHeader
        title="Zaloguj się"
        subtitle="Użyj swojego konta Google, aby wejść do Shatterpoint Client."
      />
      <CardContent>
        <Button
          onClick={() => (window.location.href = GOOGLE_START)}
          variant="primary"
          size="lg"
          leftIcon={GoogleIcon}
          aria-label="Zaloguj przez Google"
        >
          Zaloguj przez Google
        </Button>
      </CardContent>
    </Card>
  );
}
