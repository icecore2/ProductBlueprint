import { db } from './db';
import { 
  users, 
  categories,
  services,
  subscriptions,
  type InsertUser,
  type InsertCategory,
  type InsertService,
  type InsertSubscription
} from '@shared/schema';
import { DEFAULT_SERVICES, DEFAULT_USER } from '../client/src/lib/constants';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database with initial data...');

  try {
    // Check if there are already users in the database
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      console.log('Adding default household member...');
      const defaultUser: InsertUser = {
        name: "Default Member",
        email: "default@example.com",
        color: "#3b82f6", // Blue color
        notificationEnabled: true,
        reminderDays: 7,
        isDefault: true,
      };
      
      // Insert default household member
      const [defaultMember] = await db.insert(users).values(defaultUser).returning();
      console.log(`Created default household member with ID: ${defaultMember.id}`);
      
      // Add additional household members with different colors
      const additionalMembers = [
        {
          name: "Sarah",
          email: "sarah@example.com",
          color: "#f97316", // Orange
          notificationEnabled: true,
          reminderDays: 5,
          isDefault: false,
        },
        {
          name: "Mike",
          email: "mike@example.com",
          color: "#8b5cf6", // Purple
          notificationEnabled: true,
          reminderDays: 3,
          isDefault: false,
        }
      ];
      
      // Add additional household members
      const memberPromises = additionalMembers.map(member => 
        db.insert(users).values(member).returning()
      );
      const memberResults = await Promise.all(memberPromises);
      const members = [defaultMember, ...memberResults.map(r => r[0])];
      
      console.log(`Added ${members.length} household members`);
      
      // Sample subscriptions for default household member
      const defaultMemberSubscriptions: Omit<InsertSubscription, 'id'>[] = [
        {
          userId: defaultMember.id,
          name: 'Netflix',
          category: 'Entertainment',
          amount: 14.99,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          billingCycle: 'monthly',
          active: true,
          description: 'Standard HD plan',
        },
        {
          userId: defaultMember.id,
          name: 'Amazon Prime',
          category: 'Entertainment',
          amount: 12.99,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          billingCycle: 'monthly',
          active: true,
          description: 'Monthly plan',
        }
      ];
      
      // Sample subscriptions for Sarah
      const sarahSubscriptions: Omit<InsertSubscription, 'id'>[] = [
        {
          userId: members[1].id,
          name: 'Spotify',
          category: 'Music',
          amount: 9.99,
          dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
          billingCycle: 'monthly',
          active: true,
          description: 'Premium individual plan',
        },
        {
          userId: members[1].id,
          name: 'Yoga Studio',
          category: 'Health',
          amount: 24.99,
          dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
          billingCycle: 'monthly',
          active: true,
          description: 'Monthly membership',
        }
      ];
      
      // Sample subscriptions for Mike
      const mikeSubscriptions: Omit<InsertSubscription, 'id'>[] = [
        {
          userId: members[2].id,
          name: 'Adobe Creative Cloud',
          category: 'Productivity',
          amount: 52.99,
          dueDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000), // 24 days from now
          billingCycle: 'monthly',
          active: true,
          description: 'All apps plan',
        },
        {
          userId: members[2].id,
          name: 'NordVPN',
          category: 'Security',
          amount: 11.99,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          billingCycle: 'monthly',
          active: true,
          description: 'Standard plan',
        }
      ];
      
      // Combine all subscriptions
      const sampleSubscriptions = [
        ...defaultMemberSubscriptions,
        ...sarahSubscriptions,
        ...mikeSubscriptions
      ];
      
      console.log('Adding sample subscriptions for household members...');
      for (const subscription of sampleSubscriptions) {
        await db.insert(subscriptions).values({
          ...subscription,
          createdAt: new Date()
        });
        console.log(`Added subscription: ${subscription.name}`);
      }
    } else {
      console.log(`Users already exist in the database. Found ${existingUsers.length} users.`);
    }
    
    // Check if there are already categories in the database
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length === 0) {
      console.log('Adding default categories...');
      const categoryColors = {
        'Entertainment': '#3b82f6',
        'Music': '#8b5cf6',
        'Productivity': '#0ea5e9',
        'Security': '#4f46e5',
        'Utilities': '#10b981',
        'Health': '#ef4444',
        'Gaming': '#f97316',
        'Education': '#eab308',
        'Food': '#f59e0b',
        'Other': '#6b7280',
      };

      for (const [name, color] of Object.entries(categoryColors)) {
        const category: InsertCategory = { name, color };
        await db.insert(categories).values(category);
        console.log(`Added category: ${name}`);
      }
    } else {
      console.log(`Categories already exist in the database. Found ${existingCategories.length} categories.`);
    }
    
    // Check if there are already services in the database
    const existingServices = await db.select().from(services);
    
    if (existingServices.length === 0) {
      console.log('Adding default services...');
      for (const service of DEFAULT_SERVICES) {
        const newService: InsertService = {
          name: service.name,
          category: service.category,
          averagePrice: service.averagePrice,
          icon: service.icon,
        };
        const [insertedService] = await db.insert(services).values(newService).returning();
        console.log(`Added service: ${service.name}`);
        
        // Add default plans for certain services
        if (service.name === 'Netflix') {
          const netflixPlans = [
            {
              serviceId: insertedService.id,
              name: "Basic",
              price: 9.99,
              description: "Basic plan with limited features",
              createdAt: new Date()
            },
            {
              serviceId: insertedService.id,
              name: "Standard",
              price: 14.99,
              description: "Standard plan with HD streaming",
              createdAt: new Date()
            },
            {
              serviceId: insertedService.id,
              name: "Premium",
              price: 19.99,
              description: "Premium plan with 4K streaming",
              createdAt: new Date()
            }
          ];
          
          for (const plan of netflixPlans) {
            await db.insert(servicePlans).values(plan);
          }
          console.log(`Added plans for service: ${service.name}`);
        }
        else if (service.name === 'Spotify') {
          const spotifyPlans = [
            {
              serviceId: insertedService.id,
              name: "Individual",
              price: 9.99,
              description: "For individual users",
              createdAt: new Date()
            },
            {
              serviceId: insertedService.id,
              name: "Duo",
              price: 12.99,
              description: "For two users in the same household",
              createdAt: new Date()
            },
            {
              serviceId: insertedService.id,
              name: "Family",
              price: 15.99,
              description: "For up to 6 users in the same household",
              createdAt: new Date()
            }
          ];
          
          for (const plan of spotifyPlans) {
            await db.insert(servicePlans).values(plan);
          }
          console.log(`Added plans for service: ${service.name}`);
        }
        else if (service.name === 'Disney+') {
          const disneyPlans = [
            {
              serviceId: insertedService.id,
              name: "Monthly",
              price: 7.99,
              description: "Billed monthly",
              createdAt: new Date()
            },
            {
              serviceId: insertedService.id,
              name: "Annual",
              price: 79.99 / 12,
              description: "Billed annually (save 16%)",
              createdAt: new Date()
            },
            {
              serviceId: insertedService.id,
              name: "Disney Bundle",
              price: 13.99,
              description: "Includes Disney+, Hulu, and ESPN+",
              createdAt: new Date()
            }
          ];
          
          for (const plan of disneyPlans) {
            await db.insert(servicePlans).values(plan);
          }
          console.log(`Added plans for service: ${service.name}`);
        }
        else if (service.name === 'Amazon Prime') {
          const amazonPlans = [
            {
              serviceId: insertedService.id,
              name: "Monthly",
              price: 12.99,
              description: "Billed monthly",
              createdAt: new Date()
            },
            {
              serviceId: insertedService.id,
              name: "Annual",
              price: 119 / 12,
              description: "Billed annually (save ~17%)",
              createdAt: new Date()
            }
          ];
          
          for (const plan of amazonPlans) {
            await db.insert(servicePlans).values(plan);
          }
          console.log(`Added plans for service: ${service.name}`);
        }
      }
    } else {
      console.log(`Services already exist in the database. Found ${existingServices.length} services.`);
    }

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

void seed();