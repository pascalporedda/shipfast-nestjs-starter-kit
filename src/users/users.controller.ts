import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserProfileThrottle } from '../common/decorators/throttler.decorators';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { UserIdParamDto } from '../common/dto/params.dto';
import { User } from '../auth/decorators/user.decorator';
import { FileUploadService } from '../files/services/file-upload.service';
import { FileValidationService } from '../files/services/file-validation.service';
import { FileUploadType } from '../files/dto/file-upload.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('users')
@Controller('users')
@UserProfileThrottle()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fileUploadService: FileUploadService,
    private readonly fileValidationService: FileValidationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Returns all users',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid user ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param() params: UserIdParamDto) {
    return this.usersService.findOne(params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param() params: UserIdParamDto, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(params.id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid user ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param() params: UserIdParamDto) {
    return this.usersService.remove(params.id);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB limit for avatars
      files: 1,
    },
  }))
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 avatar uploads per minute
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Avatar uploaded successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @User('id') userId: string,
  ): Promise<UserResponseDto> {
    if (!file) {
      throw new BadRequestException('No avatar file provided');
    }

    // Validate avatar file
    const validationOptions = this.fileValidationService.getValidationOptionsForType(FileUploadType.AVATAR);
    await this.fileValidationService.validateFilesOrThrow([file], validationOptions);

    // Upload avatar
    const uploadedFile = await this.fileUploadService.uploadFile(file, {
      userId,
      folder: 'avatars',
      isPublic: true,
      metadata: { type: 'avatar' },
    });

    // Update user's avatar URL
    const updatedUser = await this.usersService.update(userId, {
      avatar: uploadedFile.url,
    });

    return updatedUser;
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Remove user avatar' })
  @ApiResponse({
    status: 200,
    description: 'Avatar removed successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async removeAvatar(@User('id') userId: string): Promise<UserResponseDto> {
    // Update user's avatar to null
    const updatedUser = await this.usersService.update(userId, {
      avatar: null,
    });

    return updatedUser;
  }
}
