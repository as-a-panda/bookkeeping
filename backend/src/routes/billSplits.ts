import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Create bill split
router.post('/', async (req: AuthRequest, res: Response) => {
  const { transactionId, description, totalAmount, participants } = req.body;
  if (!transactionId || !description || !totalAmount || !participants?.length) {
    return res.status(400).json({ error: '请填写必填字段' });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId: req.userId },
  });
  if (!transaction) return res.status(404).json({ error: '交易记录不存在' });

  const billSplit = await prisma.billSplit.create({
    data: {
      transactionId,
      userId: req.userId!,
      description,
      totalAmount: Number(totalAmount),
      participants: JSON.stringify(participants),
    },
  });
  res.status(201).json(billSplit);
});

// Settle a participant
router.put('/:id/settle/:participantIndex', async (req: AuthRequest, res: Response) => {
  const { id, participantIndex } = req.params;
  const billSplit = await prisma.billSplit.findFirst({
    where: { id: Number(id), userId: req.userId },
  });
  if (!billSplit) return res.status(404).json({ error: '分摊记录不存在' });

  const participants = JSON.parse(billSplit.participants);
  const idx = Number(participantIndex);
  if (idx < 0 || idx >= participants.length) {
    return res.status(400).json({ error: '参与者索引无效' });
  }

  participants[idx].settled = true;

  const updated = await prisma.billSplit.update({
    where: { id: Number(id) },
    data: { participants: JSON.stringify(participants) },
  });
  res.json(updated);
});

// Delete
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const billSplit = await prisma.billSplit.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!billSplit) return res.status(404).json({ error: '分摊记录不存在' });

  await prisma.billSplit.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: '删除成功' });
});

export default router;
