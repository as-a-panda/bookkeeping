import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const rules = await prisma.recurringRule.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rules);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { frequency, interval, nextDate, endDate, transactionTemplate, active } = req.body;
  if (!frequency || !nextDate || !transactionTemplate) {
    return res.status(400).json({ error: '请填写必填字段' });
  }

  const rule = await prisma.recurringRule.create({
    data: {
      userId: req.userId!,
      frequency,
      interval: interval || 1,
      nextDate: new Date(nextDate),
      endDate: endDate ? new Date(endDate) : null,
      transactionTemplate: JSON.stringify(transactionTemplate),
      active: active !== false,
    },
  });
  res.status(201).json(rule);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const rule = await prisma.recurringRule.findFirst({
    where: { id: Number(id), userId: req.userId },
  });
  if (!rule) return res.status(404).json({ error: '规则不存在' });

  const data: any = { ...req.body };
  if (data.nextDate) data.nextDate = new Date(data.nextDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  if (data.transactionTemplate) data.transactionTemplate = JSON.stringify(data.transactionTemplate);

  const updated = await prisma.recurringRule.update({
    where: { id: Number(id) },
    data,
  });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const rule = await prisma.recurringRule.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!rule) return res.status(404).json({ error: '规则不存在' });

  await prisma.recurringRule.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: '删除成功' });
});

export default router;
