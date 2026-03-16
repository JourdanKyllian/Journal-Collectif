import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminSeedService } from './common/database/seed/admin.seed';

import { Users } from './users/entities/user.entity';
import { Role } from './role/entities/role.entity';
import { UsersModule } from './users/users.module';
import { RoleModule } from './role/role.module';
import { ArticleModule } from './article/article.module';
import { DeclarationObjetModule } from './declaration-objet/declaration-objet.module';
import { ImageArticleModule } from './image-article/image-article.module';
import { VueStatistiqueModule } from './vue-statistique/vue-statistique.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'journal',
      autoLoadEntities: true,
      synchronize: true,
    }),
    
    // On déclare les modules pour que le SeedService puisse y accéder
    TypeOrmModule.forFeature([Users, Role]), 
    
    JwtModule.register({
      global: true, // Rend JWT accessible partout sans réimport
      secret: 'TA_CLEF_SECRETE_ICI', // À mettre en .env en prod
      signOptions: { expiresIn: '1h' }, // J'ai mis 1h, 5m c'est trop court pour développer sans devenir fou !
    }),
    
    UsersModule,
    RoleModule,
    ArticleModule,
    DeclarationObjetModule,
    ImageArticleModule,
    VueStatistiqueModule,
    CategoryModule
  ],
  providers: [AdminSeedService],
})

// On utilise OnModuleInit pour lancer le Seed automatiquement au démarrage du serveur
export class AppModule implements OnModuleInit {
  constructor(private readonly seedService: AdminSeedService) {}

  async onModuleInit() {
    await this.seedService.seed();
  }
}