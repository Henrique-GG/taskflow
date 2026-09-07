import { z } from 'zod';
import { PRIORITIES, STATUSES } from './task.js';

export const createTaskSchema = z.object({
  title: z.string({ required_error: 'Informe o titulo da tarefa.' }),
  subject: z.string({ required_error: 'Informe a materia da tarefa.' }),
  dueDate: z.string({ required_error: 'Informe a data de entrega.' }),
  priority: z.enum(PRIORITIES).optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().optional(),
    subject: z.string().optional(),
    dueDate: z.string().optional(),
    priority: z.enum(PRIORITIES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Envie ao menos um campo para atualizar.',
  });

export const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  subject: z.string().optional(),
});

export type CreateTaskDTO = z.infer<typeof createTaskSchema>;
export type UpdateTaskDTO = z.infer<typeof updateTaskSchema>;
export type ListQueryDTO = z.infer<typeof listQuerySchema>;
