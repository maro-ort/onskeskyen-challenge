import { HttpException, HttpStatus, Inject, Logger, UseGuards } from '@nestjs/common'
import { Resolver, Query, Args, Mutation, ID } from '@nestjs/graphql'
import {
  UpdateProductInput,
  SyncProductResult,
  ProductFilterInput,
  UpdateProductL10nInput,
  UpdateProductMediaInput,
  UpdateProductInBoxInput,
} from './dto/products.dto'
import { ShopProduct } from './dto/shop-product.dto'
import { Product } from './entities/product.entity'
import { ProductsService } from './products.service'
import { ObjectID } from 'typeorm'
import { AuthGuard } from '@nestjs/passport'
import { JwtGuard } from 'src/auth/jwt.guard'
import { ProductInBox, ProductL10n, ProductMedia } from './entities/product-polymorphic.entity'
// import { AuthGuard } from 'src/auth/auth.guard'

@Resolver()
export class ProductsResolver {
  constructor(@Inject(ProductsService) private productsService) {}

  /***
   * Frontend Queries
   */

  @Query(returns => ShopProduct)
  shopProduct(@Args('slug', { type: () => String }) slug: string) {
    return this.productsService
      .findShopProduct({ slug })
      .then(product => {
        if (!product) throw new Error(`Product ${slug} doesn't have available variants`)
        return product
      })
      .then(ShopProduct.fromEntity)
      .then(product => {
        if (!product.isPublished) throw new Error(`Product ${slug} is not published`)
        return product
      })
      .catch(e => {
        Logger.error('Failed to run productsService.findShopProduct')
        Logger.error(e)
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
      })
  }

  @Query(returns => [ShopProduct])
  shopProducts() {
    return this.productsService
      .findShopProducts()
      .then(products => Promise.all(products.map(ShopProduct.fromEntity)))
      .then(products => products.filter(({ isPublished }) => isPublished))

      .catch(e => {
        Logger.error('Failed to run productsService.findShopProducts')
        Logger.error(e)
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
      })
  }

  /***
   * Backend Queries
   */
  @Query(returns => Product)
  product(@Args('slug') slug: string) {
    return this.productsService.findSlug(slug).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Query(returns => [Product])
  products() {
    return this.productsService.findAll().catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @UseGuards(JwtGuard)
  @Query(returns => [Product])
  productsFilter(@Args('filter', { type: () => ProductFilterInput }) filter: ProductFilterInput) {
    return this.productsService.findFilter(filter).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  /***
   * Mutations
   */

  @Mutation(returns => Product)
  fakeAdd(@Args('slug') slug: string) {
    return this.productsService.fakeAdd(slug)
  }

  @Mutation(returns => Product)
  updateProduct(@Args('slug') slug: string, @Args('input') input: UpdateProductInput): Promise<Product> {
    return this.productsService.updateProduct(slug, input).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Mutation(returns => Product)
  updateProductParentCameras(
    @Args('slug') slug: string,
    @Args('parentSlugs', { type: () => [String] }) parentSlugs: string[]
  ): Promise<Product> {
    return this.productsService.updateProductParentCameras(slug, parentSlugs).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Mutation(returns => [ProductL10n])
  updateProductL10n(
    @Args('slug') slug: string,
    @Args('l10n', { type: () => [UpdateProductL10nInput] }) l10n: [UpdateProductL10nInput]
  ) {
    return this.productsService.updateProductL10n(slug, l10n).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Mutation(returns => [ProductMedia])
  updateProductMedia(
    @Args('slug') slug: string,
    @Args('media', { type: () => [UpdateProductMediaInput] }) media: UpdateProductMediaInput[]
  ) {
    return this.productsService.uptadeProductMedia(slug, media).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Mutation(returns => [ProductInBox])
  updateProductInBox(
    @Args('slug') slug: string,
    @Args('inBox', { type: () => [UpdateProductInBoxInput] }) inBox: UpdateProductInBoxInput[]
  ) {
    return this.productsService.updateProductInbox(slug, inBox).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Mutation(returns => [Product])
  sortProducts(@Args('input', { type: () => [ID] }) input: ObjectID[]): Product[] {
    return this.productsService.sortProducts(input).catch(e => {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }

  @Mutation(returns => SyncProductResult)
  syncProducts(): Promise<SyncProductResult> {
    return this.productsService.syncProducts().catch(e => {
      console.log({ e })

      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    })
  }
}
