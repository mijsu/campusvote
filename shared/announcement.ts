import { z } from "zod";

export const announcementSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  author: z.string(),
});

export type Announcement = z.infer<typeof announcementSchema>;
