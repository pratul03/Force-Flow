import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateBankDetailsDto } from '../dto/update-bank-details.dto';
import { UpdateCompensationDto } from '../dto/update-compensation.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, organizationId: string) {
    const password = await hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        employeeId: dto.employeeId,
        organizationId,
        joiningDate: new Date(dto.joiningDate),
        role: dto.role,
        status: dto.status,
        employmentType: dto.employmentType,
        preferredLanguage: dto.preferredLanguage,
        preferredCurrency: dto.preferredCurrency,
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        locationId: dto.locationId,
        managerId: dto.managerId,
      },
      select: {
        id: true,
        email: true,
        avatarUrl: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        employeeId: true,
        organizationId: true,
        departmentId: true,
        designationId: true,
        locationId: true,
        managerId: true,
        joiningDate: true,
        createdAt: true,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        avatarUrl: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        employeeId: true,
        organizationId: true,
        departmentId: true,
        designationId: true,
        locationId: true,
        managerId: true,
        joiningDate: true,
        preferredLanguage: true,
        preferredCurrency: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        email: true,
        avatarUrl: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        employeeId: true,
        organizationId: true,
        departmentId: true,
        designationId: true,
        locationId: true,
        managerId: true,
        joiningDate: true,
        preferredLanguage: true,
        preferredCurrency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        avatarUrl: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        employeeId: true,
        organizationId: true,
        departmentId: true,
        designationId: true,
        locationId: true,
        managerId: true,
        joiningDate: true,
        preferredLanguage: true,
        preferredCurrency: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    await this.prisma.user.delete({ where: { id } });

    return { deleted: true, id };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Do not reveal that the user does not exist
      return { message: 'If that email is in our database, we will send a password reset link to it.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Upsert the token
    await this.prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: {
        tokenHash,
        expiresAt,
      },
      create: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // TODO: Send email using notifications module
    console.log(`[Mock Email] Password reset token for ${user.email}: ${resetToken}`);

    return { message: 'If that email is in our database, we will send a password reset link to it.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const hashedPassword = await hash(dto.newPassword, 10);

    // Update user password and delete the token
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.delete({
        where: { id: resetRecord.id },
      }),
    ]);

    return { message: 'Password has been successfully reset.' };
  }

  async getBankDetails(userId: string) {
    const details = await this.prisma.userBankDetails.findUnique({
      where: { userId },
    });
    if (!details) {
      return null;
    }
    return details;
  }

  async updateBankDetails(userId: string, dto: UpdateBankDetailsDto) {
    return this.prisma.userBankDetails.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        accountName: dto.accountName ?? '',
        accountNumber: dto.accountNumber ?? '',
        bankName: dto.bankName ?? '',
        swiftCode: dto.swiftCode,
        routingNumber: dto.routingNumber,
      },
    });
  }

  async getCompensation(userId: string) {
    const compensation = await this.prisma.userCompensation.findUnique({
      where: { userId },
    });
    if (!compensation) {
      return null;
    }
    return compensation;
  }

  async updateCompensation(userId: string, dto: UpdateCompensationDto) {
    return this.prisma.userCompensation.upsert({
      where: { userId },
      update: {
        ...(dto.salaryAmount !== undefined ? { salaryAmount: dto.salaryAmount } : {}),
        ...(dto.salaryCurrency !== undefined ? { salaryCurrency: dto.salaryCurrency } : {}),
        ...(dto.payFrequency !== undefined ? { payFrequency: dto.payFrequency } : {}),
        ...(dto.effectiveDate !== undefined ? { effectiveDate: new Date(dto.effectiveDate) } : {}),
      },
      create: {
        userId,
        salaryAmount: dto.salaryAmount ?? 0,
        salaryCurrency: dto.salaryCurrency ?? 'USD',
        payFrequency: dto.payFrequency ?? 'MONTHLY',
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
      },
    });
  }
}
