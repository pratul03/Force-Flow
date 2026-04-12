import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
	getHealth() {
		return {
			status: 'ok',
			service: 'flowforce-api',
			timestamp: new Date().toISOString(),
			uptimeSeconds: process.uptime(),
		};
	}
}
