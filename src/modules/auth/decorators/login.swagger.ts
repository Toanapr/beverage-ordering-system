import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { LoginResponseDto } from '../dto/responses/login-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const LoginSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Login',
      description: 'Login API',
    }),
    ApiSuccessResponse(LoginResponseDto, {
      description: 'Login successful',
    }),
    ApiUnauthorizedResponse({
      description: 'Incorrect email or password',
    }),
    ApiForbiddenResponse({ description: 'Account has been locked' }),
  );
