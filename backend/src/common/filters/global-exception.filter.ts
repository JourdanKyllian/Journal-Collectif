import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtre global interceptant toutes les exceptions levées par l'application.
 * Standardise le format de réponse JSON et centralise la journalisation des erreurs.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  /**
   * Intercepte, formate et journalise l'exception.
   *
   * @param {unknown} exception - L'exception interceptée.
   * @param {ArgumentsHost} host - Le contexte d'exécution HTTP.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const rawMessage =
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
        ? (exceptionResponse as Record<string, unknown>).message
        : exception instanceof Error
          ? exception.message
          : 'Erreur interne du serveur';

    // Cast explicite pour satisfaire le linter strict
    const message = Array.isArray(rawMessage)
      ? String(rawMessage[0])
      : String(rawMessage);

    const rawErrorType =
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'error' in exceptionResponse
        ? (exceptionResponse as Record<string, unknown>).error
        : exception instanceof HttpException
          ? exception.name
          : 'InternalServerError';

    // Cast explicite pour satisfaire le linter strict
    const errorType = String(rawErrorType);

    // Comparaison stricte avec la valeur numérique 500 pour éviter le conflit d'énumération
    if (status === 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - 500 FATAL ERROR`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - Status: ${status} - ${errorType}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: errorType,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
