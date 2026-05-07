import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return res.status(409).json({ error: '邮箱或用户名已存在' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, passwordHash },
    });

    // Create default categories
    await createDefaultCategories(user.id);

    const token = generateToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '请填写邮箱和密码' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, username: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

async function createDefaultCategories(userId: number) {
  const expenseCategories = [
    '餐饮', '交通', '购物', '居住', '娱乐', '医疗', '教育', '通讯', '其他支出'
  ];
  const incomeCategories = [
    '工资', '奖金', '理财', '兼职', '红包', '其他收入'
  ];

  const data = [
    ...expenseCategories.map(name => ({ userId, name, type: 'EXPENSE' })),
    ...incomeCategories.map(name => ({ userId, name, type: 'INCOME' })),
  ];

  await prisma.category.createMany({ data });
}

export default router;
