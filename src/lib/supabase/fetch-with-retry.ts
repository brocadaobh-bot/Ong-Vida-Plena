const DEFAULT_TIMEOUT_MS = 12_000
const DEFAULT_RETRIES = 1
function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  const code = (error as NodeJS.ErrnoException).code
  return (
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('aborted') ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'EAI_AGAIN'
  )
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Fetch com timeout e retry leve para falhas transitórias (ECONNRESET, etc.). */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = DEFAULT_RETRIES,
): Promise<Response> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      })
      clearTimeout(timeout)
      return response
    } catch (error) {
      clearTimeout(timeout)
      lastError = error
      if (attempt < retries && isRetryableFetchError(error)) {
        await sleep(400 * (attempt + 1))
        continue
      }
      throw error
    }
  }

  throw lastError
}
