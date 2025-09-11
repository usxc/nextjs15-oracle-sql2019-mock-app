'use client';

/**
 * 共通の PUT JSON ヘルパー
 */
async function putJson(url: string, body: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown error' };
  }
}

/**
 * 回答の保存
 */
export async function saveAnswer(input: { attemptQuestionId: string; selectedChoiceIds: string[] }) {
  return putJson('/api/attempts/answers', input);
}

/**
 * 見直しフラグの更新
 */
export async function toggleMark(input: { attemptQuestionId: string; next: boolean }) {
  return putJson('/api/attempts/mark', input);
}