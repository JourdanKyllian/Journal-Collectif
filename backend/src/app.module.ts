import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminSeedService } from './common/database/seed/admin.seed';
import { dataSourceOptions } from './common/database/data-source';

import { Users } from './users/entities/user.entity';
import { Role } from './roles/entities/roles.entity';
import { UsersModule } from './users/users.module';
import { RoleModule } from './roles/roles.module';
import { ArticleModule } from './article/article.module';
import { DeclarationObjetModule } from './declaration-objet/declaration-objet.module';
import { ImageArticleModule } from './image-article/image-article.module';
import { VueStatistiqueModule } from './vue-statistique/vue-statistique.module';
import { CategoryModule } from './categorie/categorie.module';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { TableSeedService } from './common/database/seed/table.seed';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: () => ({
          context: 'HTTP',
        }),
        transport: undefined, // undefined force la sortie en JSON brut
      },
    }),

    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),

    TypeOrmModule.forFeature([Users, Role]),

    JwtModule.register({
      global: true,
      secret: 'TA_CLEF_SECRETE_ICI',
      signOptions: { expiresIn: '1h' },
    }),

    UsersModule,
    RoleModule,
    ArticleModule,
    DeclarationObjetModule,
    ImageArticleModule,
    VueStatistiqueModule,
    CategoryModule,
    AuthModule,
    HealthModule,
  ],
  providers: [AdminSeedService, TableSeedService],
})

// On garde uniquement NestModule pour ton Middleware de logs
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
