export function formatCents(value: number): string {
  return `${Math.round(value * 100)}¢`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatDate(input: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(input));
}

export function formatDateTime(input: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(input));
}

export function formatMarketStatus(status?: string): string {
  if (status === "CUTOFF_LOCKED") return "Closed";
  if (status === "RESOLVED") return "Delivered";
  return "Open";
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = (await response.json()) as T;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return payload;
}
