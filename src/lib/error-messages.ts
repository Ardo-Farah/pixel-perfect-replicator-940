// Maps technical errors to friendly, themed user messages.
// Never expose raw API/JSON to users — funnel everything through here.

export type FriendlyError = {
  title: string;
  message: string;
  actionLabel: string;
  variant: "warning" | "error" | "info";
  // semantic action key — caller decides what it does
  action: "retry" | "reupload" | "close" | "signin";
};

export function uploadErrorFromStatus(status: number): FriendlyError {
  switch (status) {
    case 422:
      return {
        title: "We couldn't read this report",
        message:
          "This file doesn't look like a weekly bulletin we can process. Please upload the correct weekly report PDF.",
        actionLabel: "Upload Correct File",
        variant: "warning",
        action: "reupload",
      };
    case 415:
      return {
        title: "Unsupported file type",
        message:
          "Only PDF and DOCX files are accepted for weekly bulletins. Please choose a supported file and try again.",
        actionLabel: "Choose Another File",
        variant: "warning",
        action: "reupload",
      };
    case 401:
      return {
        title: "Your session expired",
        message: "Please sign in again to continue uploading reports.",
        actionLabel: "Sign In Again",
        variant: "info",
        action: "signin",
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        title: "Something went wrong on our end",
        message:
          "The server couldn't process this upload. Please try again in a moment.",
        actionLabel: "Retry",
        variant: "error",
        action: "retry",
      };
    default:
      return {
        title: "Upload failed",
        message: "We couldn't complete the upload. Please try again.",
        actionLabel: "Retry",
        variant: "error",
        action: "retry",
      };
  }
}

export function authErrorFromSupabase(message: string): {
  field: "email" | "password" | "form";
  text: string;
} {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid_credentials")) {
    return { field: "password", text: "Incorrect password. Please try again." };
  }
  if (m.includes("user not found") || m.includes("no user")) {
    return { field: "email", text: "No account found for this email." };
  }
  if (m.includes("email not confirmed")) {
    return {
      field: "email",
      text: "Please confirm your email address before signing in.",
    };
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return { field: "email", text: "An account with this email already exists." };
  }
  if (m.includes("password")) {
    return { field: "password", text: "Please check your password and try again." };
  }
  return { field: "form", text: "Something went wrong. Please try again." };
}
