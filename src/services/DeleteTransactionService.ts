import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transationsRepository = getCustomRepository(TransactionRepository);

    const transaction = await transationsRepository.findOne(id);

    if(!transaction){
      throw new AppError('Transaction does not exist.')
    }

    await transationsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
