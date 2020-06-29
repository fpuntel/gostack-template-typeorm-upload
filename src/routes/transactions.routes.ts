import { Router } from 'express';
import multer from 'multer';
import { getCustomRepository, Transaction } from 'typeorm';

import uploadConfiguration from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const upload = multer(uploadConfiguration);

const transactionsRouter = Router();
 
transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.find();
  
  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category} = request.body;

  const createTrasaction = new CreateTransactionService();

  const transation = await createTrasaction.execute({
    title,
    value,
    type,
    category
  });

  return response.json(transation);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransation = new DeleteTransactionService();

  await deleteTransation.execute(id);

  return response.status(204).send();
});

transactionsRouter.post('/import', upload.single('file'), async (request, response) => {
  const importTransations = new ImportTransactionsService();

  const transations = await importTransations.execute(request.file.path);

  return response.json(transations);
});

export default transactionsRouter;
