import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

// Filtro global que captura cualquier excepción y responde con un JSON estandarizado de error.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {

  // Maneja cualquier excepción lanzada en el contexto HTTP y responde con formato uniforme.
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.getResponse() : 'Internal Server Error';
    res.status(status).json({
      statusCode: status,
      path: req.url,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
