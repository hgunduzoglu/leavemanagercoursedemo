import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

/**
 * The one central error handler (docs/conventions.md, Error handling). Nothing internal reaches
 * the client: a client error (4xx raised by Fastify, e.g. a malformed body) keeps its status with a
 * generic body; anything else is an unexpected 500. The detail goes to the server log only.
 */
export function handleError(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 400 && statusCode < 500) {
    return reply.status(statusCode).send({
      error: { code: "BAD_REQUEST", message: "İstek geçersiz." },
    });
  }
  request.log.error({ err: error }, "unexpected error");
  return reply.status(500).send({
    error: { code: "INTERNAL_ERROR", message: "Beklenmeyen bir hata oluştu." },
  });
}

/** An unmatched route never reaches handleError — it gets the same error body here. */
export function handleNotFound(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(404).send({
    error: { code: "NOT_FOUND", message: "Kaynak bulunamadı." },
  });
}
