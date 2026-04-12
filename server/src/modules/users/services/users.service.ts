import { Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const password = await hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        employeeId: dto.employeeId,
        organizationId: dto.organizationId,
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

  findAll() {
    return this.prisma.user.findMany({
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

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

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

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.delete({ where: { id } });

    return { deleted: true, id };
  }
}
