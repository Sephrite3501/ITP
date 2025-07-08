interface AxiosErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

export function getFriendlyError(error: AxiosErrorResponse, fallbackCode = 'GENERIC'): string {
  const traceId = generateTraceId(fallbackCode);
  const serverMsg = error?.response?.data?.error;

  if (serverMsg && typeof serverMsg === 'string' && !serverMsg.toLowerCase().includes('internal')) {
    return `${serverMsg} (Ref: ${traceId})`;
  }

  if (error?.message === 'Network Error') {
    return `Cannot reach the server. Please try again. (Ref: ${traceId})`;
  }

  return `Something went wrong. Please contact support. (Ref: ${traceId})`;
}

function generateTraceId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${rand}`;
}
