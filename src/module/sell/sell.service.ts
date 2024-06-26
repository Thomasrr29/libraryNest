import { Injectable, NotFoundException, Query } from '@nestjs/common';
import { CreateSellDto } from './dto/create-sell.dto';
import { UpdateSellDto } from './dto/update-sell.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Sells } from './entities/sell.entity';
import { ILike, Repository } from 'typeorm';
import { CreateAuthorDto } from '../author/dto/create-author.dto';
import { Author } from '../author/entities/author.entity';
import { Book } from '../book/entities/book.entity';

@Injectable()
export class SellService {


  constructor(@InjectRepository(Sells) private readonly sellRepository: Repository<Sells>,
              @InjectRepository(Author) private readonly authorRepository: Repository<Author>,
              @InjectRepository(Book) private readonly bookRepository: Repository<Book>){}

  async create(createSellDto: CreateSellDto) {

    const {bookId, date, authorId} = createSellDto

    const book = await this.bookRepository.findOneBy({id: bookId})

    if(!book){
      throw new NotFoundException(`The book with the id ${bookId} wasn't found`)
    }

    const author = await this.authorRepository.findOneBy({id: authorId })

    const sell = this.sellRepository.create({
      date,
      book,
      author,
    })

    return await this.sellRepository.save(sell)
  }

  async findAll(

    page: number,
    limit: number,

  ){

    const queryBuilder = this.sellRepository.createQueryBuilder('sell')
    .skip((page - 1) * limit)
    .take(limit)

    const [results, total] = await queryBuilder.getManyAndCount()

    return {
      data: results,
      page,
      totalCount: total,
      total: Math.ceil(total/limit)
    }

  }

  async findOneBy(
    search: {searchValue: string, searchField: string},
    order: {orderField: string, direction: 'ASC' | 'DESC'}
  ){

    const {searchField, searchValue} = search
    const {orderField, direction} = order

    const [results, total] = await this.sellRepository.findAndCount({
      where: {
        [searchField]: ILike(`%${searchValue}%`)
      }, 
      order: {
        [orderField]: direction
      }
    })

    return {
      results,
      total
    }
  }

  async update(search: {searchValue: string, searchField: string}, updateSellDto: UpdateSellDto){

    const {searchValue, searchField} = search
    const validateFields = ['id', 'bookId', 'authorId']

    if(!validateFields.includes(searchField)){
      throw new NotFoundException(`The ${searchField} field wasn't found in the available fields`)
    }

    const result = await this.sellRepository.update
    ({[searchField]: ILike(`%${searchValue}%`)}, updateSellDto)


    if(!result){
      throw new NotFoundException(`The sell wasn't found`)
    }

    return result;
  }

  async remove(id: number) {
    
    const validation = await this.sellRepository.findOneBy({id})

    if(!validation){
      throw new NotFoundException(`The sell with the id ${id} wasn't found`)
    }

    return this.sellRepository.softDelete(id)

  }
}
