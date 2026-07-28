import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminSeedService } from './common/database/seed/admin.seed';
import { dataSourceOptions } from './common/database/data-source';

import { Users } from './users/entities/user.entity';
import { Role } from './roles/entities/roles.entity';
import { Categorie } from './categorie/entities/categorie.entity'; // <-- Ajout
import { Article } from './article/entities/article.entity'; // <-- Ajout

import { UsersModule } from './users/users.module';
import { RoleModule } from './roles/roles.module';
import { ArticleModule } from './article/article.module';
import { DeclarationObjetModule } from './declaration-objet/declaration-objet.module';
import { ImageArticleModule } from './image-article/image-article.module';
import { VueStatistiqueModule } from './vue-statistique/vue-statistique.module';
import { CategorieModule } from './categorie/categorie.module';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { TableSeedService } from './common/database/seed/table.seed';
import { HealthModule } from './health/health.module';
import { ProfileModule } from './profile/profile.module';
import { SettingsModule } from './settings/settings.module';
import { AlertsModule } from './alerts/alerts.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: () => ({
          context: 'HTTP',
        }),
        transport: undefined,
      },
    }),

    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),

    // <-- Ajout de Categorie et Article ici pour que le seed puisse les utiliser
    TypeOrmModule.forFeature([Users, Role, Categorie, Article]),

    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'fallback_insecure_key',
      signOptions: { expiresIn: '1h' },
    }),

    UsersModule,
    RoleModule,
    ArticleModule,
    DeclarationObjetModule,
    ImageArticleModule,
    VueStatistiqueModule,
    CategorieModule,
    AuthModule,
    HealthModule,
    ProfileModule,
    SettingsModule,
    AlertsModule,
  ],
  providers: [AdminSeedService, TableSeedService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
