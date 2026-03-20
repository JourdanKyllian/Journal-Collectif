import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminSeedService } from './common/database/seed/admin.seed';
import { dataSourceOptions } from './common/database/data-source';

import { Users } from './users/entities/user.entity';
import { Role } from './role/entities/role.entity';
import { UsersModule } from './users/users.module';
import { RoleModule } from './role/role.module';
import { ArticleModule } from './article/article.module';
import { DeclarationObjetModule } from './declaration-objet/declaration-objet.module';
import { ImageArticleModule } from './image-article/image-article.module';
import { VueStatistiqueModule } from './vue-statistique/vue-statistique.module';
import { CategoryModule } from './category/category.module';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true
    }),
    
    // Déclarations modules pour que SeedService puisse y accéder
    TypeOrmModule.forFeature([Users, Role]), 
    
    JwtModule.register({
      global: true, // Rend JWT accessible partout
      secret: 'TA_CLEF_SECRETE_ICI', // À mettre en .env en prod
      signOptions: { expiresIn: '1h' }, // 5m c'est trop court pour développer
    }),
    
    UsersModule,
    RoleModule,
    ArticleModule,
    DeclarationObjetModule,
    ImageArticleModule,
    VueStatistiqueModule,
    CategoryModule,
    AuthModule
  ],
  providers: [AdminSeedService],
})

// OnModuleInit lance le Seed automatiquement au démarrage du serveur
// NestModule applique un Middleware sur toutes les routes pour loguer
export class AppModule implements OnModuleInit, NestModule {
  constructor(private readonly seedService: AdminSeedService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*'); // On l'applique à TOUTES les routes
  }

  async onModuleInit() {
    await this.seedService.seed();
  }
}