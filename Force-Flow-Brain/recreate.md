# Spring Boot Re-architecture (Java Recreate)

## Overview
This document outlines the architecture, folder structure, and application layout required to recreate the Force-Flow NestJS backend in **Java using Spring Boot**, while connecting to the **exact same PostgreSQL database**.

## Tech Stack Mapping
| NestJS (Current) | Spring Boot (New) |
| :--- | :--- |
| NestJS 11 | Spring Boot 3.x (Java 21+) |
| Prisma ORM | Spring Data JPA (Hibernate) or jOOQ |
| Passport + JWT | Spring Security + JWT |
| class-validator | Jakarta Bean Validation (`@Valid`, Hibernate Validator) |
| BullMQ / Schedulers | Spring AMQP (RabbitMQ) / Quartz / `@Scheduled` |
| Swagger/OpenAPI | Springdoc OpenAPI |

## Database Strategy
Since the PostgreSQL database structure remains identical, you have two primary approaches:
1. **JPA/Hibernate (Database-First Mapping):** Create JPA `@Entity` classes that precisely map to the existing tables. Since Prisma generates specific naming conventions (often PascalCase table names unless mapped otherwise), your `@Table(name = "User")` and `@Column` annotations must match the database strictly.
2. **Prisma as Migration Engine:** Continue using Prisma (`schema.prisma` and `prisma migrate dev`) solely as the database migration and schema management tool, while Java interacts with the resulting tables. (Alternatively, you can export the schema to Flyway/Liquibase).

## Folder Structure
We will adopt a **Modular Monolith** structure, aligning perfectly with the domain-driven design currently used in NestJS.

```text
force-flow-spring/
├── pom.xml (or build.gradle)
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/forceflow/hrms/
    │   │       ├── ForceFlowApplication.java
    │   │       ├── common/                 # Global utilities, exceptions, filters
    │   │       │   ├── exceptions/         # GlobalExceptionHandler (@ControllerAdvice)
    │   │       │   ├── security/           # JWT Filters, Authentication Providers
    │   │       │   └── config/             # Swagger, CORS, Async configs
    │   │       └── modules/                # Domain-driven feature modules
    │   │           ├── auth/
    │   │           ├── users/
    │   │           │   ├── controllers/    # @RestController endpoints
    │   │           │   ├── services/       # @Service business logic
    │   │           │   ├── repositories/   # Spring Data @Repository interfaces
    │   │           │   ├── entities/       # JPA @Entity classes
    │   │           │   └── dtos/           # Java Records / DTO Classes
    │   │           ├── attendance/
    │   │           ├── leaves/
    │   │           ├── payroll/
    │   │           ├── wallet/
    │   │           └── (other modules...)
    │   └── resources/
    │       ├── application.yml         # Environment config, DB URL, JWT secrets
    │       └── db/migration/           # (Optional) Flyway/Liquibase scripts
    └── test/                           # JUnit 5 + Mockito / Testcontainers
```

## Architectural Components

### 1. Controllers (`@RestController`)
Responsible for routing HTTP requests, handling JWT extraction, validating incoming JSON, and delegating work. No business logic belongs here.
```java
@RestController
@RequestMapping("/api/v1/employees")
@Tag(name = "Employees")
public class EmployeeController {
    // Inject EmployeeService
}
```

### 2. Services (`@Service`)
Owns the core business logic. Should use `@Transactional` to ensure data integrity, especially for complex operations like Payroll or Wallet transfers.
```java
@Service
@Transactional
public class EmployeeService {
    // Inject UserRepository, WalletRepository
}
```

### 3. Repositories (`@Repository`)
Interfaces extending `JpaRepository` for data access. Spring Data generates the implementation at runtime.
```java
@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.department.id = :deptId")
    List<User> findByDepartmentId(@Param("deptId") String deptId);
}
```

### 4. DTOs (Data Transfer Objects)
Use **Java Records** (introduced in Java 14) for immutable data transfer. Use `MapStruct` to map between Entities and Records.
```java
public record CreateEmployeeDto(
    @NotBlank(message = "Email is required") 
    @Email 
    String email,
    
    @NotBlank 
    String firstName,
    
    @NotBlank 
    String lastName
) {}
```

## Migration Steps
1. **Bootstrap:** Initialize a Spring Boot project via Spring Initializr (Web, Data JPA, Security, PostgreSQL Driver, Validation).
2. **Entity Generation:** Map existing PostgreSQL tables to JPA entities. Pay strict attention to foreign keys and relations (One-to-Many, Many-to-Many) originally configured by Prisma.
3. **Security Configuration:** Implement a stateless JWT filter extending `OncePerRequestFilter` to perfectly replace the NestJS Passport strategy.
4. **Module Migration:** Translate NestJS modules one-by-one in a logical order (e.g., Auth -> Users -> Attendance -> Leaves -> Wallet -> Payroll).
5. **Testing Parity:** Write integration tests via `@SpringBootTest` and `Testcontainers` to guarantee absolute parity with the Node.js API responses, ensuring the Next.js frontend requires ZERO changes.
