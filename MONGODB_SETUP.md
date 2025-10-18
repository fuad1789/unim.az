# MongoDB Setup for UNIM.AZ

Bu sənəd MongoDB-ni UNIM.AZ layihəsində necə quraşdırmaq və istifadə etmək barədə təlimatları ehtiva edir.

## 1. MongoDB Quraşdırılması

### Lokal Quraşdırma

1. MongoDB-ni kompüterinizə quraşdırın: https://www.mongodb.com/try/download/community
2. MongoDB servisini başladın
3. MongoDB Compass istifadə edərək bağlantını yoxlayın

### MongoDB Atlas (Bulud)

1. https://www.mongodb.com/atlas saytında hesab yaradın
2. Yeni cluster yaradın
3. Connection string-i əldə edin

## 2. Environment Variables

`.env.local` faylını yaradın və aşağıdakı dəyərləri əlavə edin:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/unim-az

# Production üçün MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/unim-az?retryWrites=true&w=majority
```

## 3. Data Migration

Mövcud `sdu.json` faylını MongoDB-yə köçürmək üçün:

```bash
# Migration scriptini işə salın
node scripts/migrate-to-mongodb.mjs
```

## 4. API Endpoints

### Groups

- `GET /api/groups` - Bütün qrupları əldə et
- `GET /api/groups?faculty=Mühəndislik` - Fakultəyə görə filtrlə
- `GET /api/groups/[groupId]` - Müəyyən qrupu əldə et
- `POST /api/groups` - Yeni qrup yarat
- `PUT /api/groups/[groupId]` - Qrupu yenilə
- `DELETE /api/groups/[groupId]` - Qrupu sil

## 5. Data Structure

### Group Schema (Simplified)

```typescript
{
  group_id: string;
  faculty: string;
  academic_load: {
    subject: string;
    total_hours: number;
  }[];
  week_schedule: {
    day: string;
    lessons: {
      time: string;
      subject: string;
      teacher: string;
      room: string;
      upper?: {
        subject: string;
        teacher: string;
        room: string;
      };
      lower?: {
        subject: string;
        teacher: string;
        room: string;
      };
    }[];
  }[];
}
```

**Qeyd:** Bu struktur sadələşdirilmişdir. Fakultə məlumatı ayrıca model olaraq saxlanmır, sadəcə string olaraq Group modelində saxlanılır.

## 6. İstifadə Nümunəsi

```typescript
import { groupService } from "@/services/groupService";

// Bütün qrupları əldə et
const groups = await groupService.getAllGroups();

// Fakultəyə görə filtrlə
const engineeringGroups = await groupService.getAllGroups("Mühəndislik");

// Müəyyən qrupu əldə et
const group = await groupService.getGroupById("681");
```

## 7. Development

```bash
# Dependencies quraşdır
npm install

# Development server başlat
npm run dev

# Migration işə sal
node scripts/migrate-to-mongodb.mjs
```

## 8. Production

Production mühitində MongoDB Atlas və ya digər cloud provider istifadə edin. Connection string-i environment variable kimi təyin edin.
