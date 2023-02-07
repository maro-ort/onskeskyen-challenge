import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { getManager, In, ObjectID, Repository } from 'typeorm'
// import * as Shopify from 'shopify-api-node'
import * as Shopify from 'shopify-buy'
import * as fetch from 'cross-fetch'

import { Region } from 'src/constants/region'
import { ProductType } from '../constants/product-type'
import { L10nType } from 'src/constants/l10n-type'
import { Language } from 'src/constants/language'
import { MediaType } from 'src/constants/media-type'

import { patch, toObjectKeys, tryMap } from 'src/utils/general'
import { parseShopifyProduct } from './utils/shopify-parse'

import { ProductRepository } from './products.repository'
import { Product } from './entities/product.entity'
import { Variant } from './variants/entities/variant.entity'
import { ProductInBox, ProductL10n, ProductMedia } from './entities/product-polymorphic.entity'
import {
  ProductFilterInput,
  SyncProductResult,
  UpdateProductInBoxInput,
  UpdateProductInput,
  UpdateProductL10nInput,
  UpdateProductMediaInput,
} from './dto/products.dto'

@Injectable()
export class ProductsService {
  relationTree = [
    'inBox',
    'l10n',
    'media',
    'parentCameras',
    'variants',
    'variants.inBox',
    'variants.l10n',
    'variants.media',
    'variants.offers',
  ]

  constructor(
    private configService: ConfigService,
    private productRepo: ProductRepository,
    @InjectRepository(Variant)
    private variantRepo: Repository<Variant>,
    @InjectRepository(ProductMedia)
    private mediaRepo: Repository<ProductMedia>
  ) {}

  /***
   * Finders
   */

  findSlug(slug: string): Promise<void | Product> {
    return this.productRepo.findOne({ where: { slug }, relations: this.relationTree })
  }

  findAll(): Promise<Product[]> {
    return this.productRepo.find({ relations: this.relationTree })
  }

  findFilter({ productType, isPublished }: ProductFilterInput): Promise<Product[]> {
    const where = {} as any
    if (productType) where.productType = productType
    if (typeof isPublished !== 'undefined') where.isPublished = isPublished
    return this.productRepo.find({ where, relations: this.relationTree })
  }

  /***
   * Frontend queries
   */
  findShopProduct({ slug }): Promise<Product> {
    return this.productRepo
      .queryShopRelations()
      .andWhere('product.slug = :slug', { slug: slug.toLowerCase() })
      .getOne()
      .then(product => {
        if (!product) throw new Error(`ShopProduct ${slug} is not available`)
        return product
      })
  }

  findShopProducts(): Promise<Product[]> {
    return this.productRepo.queryShopRelations().getMany()
  }

  /***
   * Backend mutations
   */

  updateProduct(slug: string, { parentSlugs, ...inputPatch }: UpdateProductInput): Promise<Product> {
    return this.productRepo.findOneOrFail({ slug }).then(async product => {
      if (product.productType === ProductType.ACCESSORIES) {
        const parentCameras = await this.productRepo.find({
          where: { slug: In(parentSlugs), productType: ProductType.CAMERA },
        })
        ;(inputPatch as any).parentCameras = parentCameras
      }

      return this.productRepo.save(patch(product, inputPatch))
    })
  }

  async updateProductParentCameras(slug: string, parentSlugs: string[]): Promise<Product> {
    const targetProduct = await this.productRepo.findOne({ slug })

    const parentCameras = await this.productRepo.find({
      where: {
        slug: In(parentSlugs),
        productType: ProductType.CAMERA,
      },
    })

    if (!targetProduct) throw new Error(`No target product with slug ${slug}`)
    else if (targetProduct.productType !== ProductType.ACCESSORIES)
      throw new Error(`Product ${targetProduct.slug} is not an ${ProductType.ACCESSORIES}`)

    targetProduct.parentCameras = parentCameras
    this.productRepo.save(targetProduct)
    return targetProduct
  }

  updateProductInbox(slug: string, inBox: UpdateProductInBoxInput[]): Promise<ProductInBox[]> {
    return this.productRepo.findOneOrFail({ where: { slug }, relations: ['inBox'] }).then(async product => {
      const newInBox = await Promise.all(inBox.map(UpdateProductInBoxInput.toEntity)).then(inBox =>
        inBox.map((content, order) => ({ ...content, order }))
      )
      await getManager().transaction(async manager => {
        product.inBox.length && (await manager.delete(ProductInBox, product.inBox))
        product.inBox = newInBox
        await manager.save(product)
      })

      return newInBox
    })
  }

  updateProductL10n(slug: string, l10n: [UpdateProductL10nInput]) {
    return this.productRepo.findOneOrFail({ where: { slug }, relations: ['l10n'] }).then(async product => {
      const newL10n = await Promise.all(l10n.map(UpdateProductL10nInput.toEntity))
      await getManager().transaction(async manager => {
        product.l10n.length && (await manager.delete(ProductL10n, product.l10n))
        product.l10n = newL10n
        await manager.save(product)
      })
      return newL10n
    })
  }

  uptadeProductMedia(slug: string, media: UpdateProductMediaInput[]) {
    return this.productRepo.findOneOrFail({ where: { slug }, relations: ['media'] }).then(async product => {
      const newMedia = await Promise.all(media.map(UpdateProductMediaInput.toEntity))
      await getManager().transaction(async manager => {
        product.media.length && (await manager.delete(ProductMedia, product.media))
        product.media = newMedia
        await manager.save(product)
      })
      return newMedia
    })
  }

  syncProducts(): Promise<SyncProductResult> {
    const FETCH_PAGE_SIZE = 100
    const result = {
      inserted: new Set<string>(),
      updated: new Set<string>(),
      removed: new Set<string>(),
      errors: <string[]>[],
    }
    const credentials = this.configService.get('shopify') as Record<
      string,
      {
        region: Region
        domain: string
        storefrontAccessToken: string
      }
    >

    const shopifyClients = Object.values(credentials).reduce((acc, c) => {
      const buildClient = Shopify.buildClient as (config: Shopify.Config, fetch: any) => Shopify.Client // NOTE: Wrong typyings from package
      acc[c.region] = buildClient(c, fetch)
      return acc
    }, {} as Record<Region, Shopify.Client>)

    return Promise.all(
      Object.entries(shopifyClients).reduce((acc: any[], [region, client]: [Region, Shopify.Client]) => {
        return [
          ...acc,
          client.product
            .fetchAll(FETCH_PAGE_SIZE)
            .then(products => tryMap(products, p => parseShopifyProduct(p, region))),
        ]
      }, [])
    )
      .then(fp => fp.reduce((acc, prod) => [...acc, ...prod], []))
      .then(fetchedProducts =>
        fetchedProducts.filter(product => {
          // TODO: Remove on production
          product.productType = product.productType ?? ProductType.TEST
          if (!Object.values(ProductType).includes(product.productType)) {
            result.errors.push(`Product ${product.slug} has an invalid PorductType: ${product.productType}`)
            return false
          } else if (product.variants.length <= 0) {
            result.errors.push(`Product ${product.slug} does not have variants`)
          }
          return true
        })
      )
      .then(async fetchedProducts => {
        for (const fetchedProduct of fetchedProducts) {
          const fetchedRegion = fetchedProduct.variants[0].region
          await this.productRepo
            .findOneOrFail({ where: { slug: fetchedProduct.slug }, relations: ['variants'] })
            .catch(() => {
              // Create new entity if not found in DB
              const { slug, productType, media, thumbnail, options } = fetchedProduct
              return this.productRepo
                .save(patch(new Product(), { slug, productType, thumbnail, options }))
                .then(newProduct =>
                  this.mediaRepo
                    .save(media.map(m => patch(new ProductMedia(), { ...m, product: newProduct })))
                    .then(() => {
                      result.inserted.add(newProduct.slug)
                      return newProduct
                    })
                )
            })
            .then(async dbProduct => {
              let isUpdated = false
              const patch = {} as Partial<Product>
              // Update Product entity
              if (dbProduct.productType !== fetchedProduct.productType) {
                patch.productType = fetchedProduct.productType
                dbProduct.productType = fetchedProduct.productType
                isUpdated = true
              }

              // Diff options per region to update
              const region = fetchedProduct.variants[0].region
              patch.options = [...dbProduct.options.filter(o => o.region !== region), ...fetchedProduct.options]

              return this.productRepo.update(dbProduct.id, patch).then(() => {
                if (isUpdated) result.updated.add(dbProduct.slug)
                return dbProduct
              })
            })
            .then(async dbProduct => {
              // Manage Variants
              const dbVariants = dbProduct.variants
              const fetchedVariants = fetchedProduct.variants

              // New product, just add variants and finish
              if (!dbVariants?.length) {
                return this.variantRepo
                  .save(fetchedVariants.map(v => patch(new Variant(), { ...v, product: dbProduct })))
                  .then(variants => {
                    dbProduct.variants = variants
                    return dbProduct
                  })
              }

              // Add variants
              for (const fetchedVariant of fetchedVariants) {
                const dbVariant = dbVariants.find(({ variantId }) => variantId === fetchedVariant.variantId)
                if (!dbVariant)
                  await this.variantRepo
                    .save(patch(new Variant(), { ...fetchedVariant, product: dbProduct }))
                    .then(() => result.updated.add(dbProduct.slug))
              }

              // Update current region variants
              const regionDbVariants = dbVariants.filter(({ region }) => region === fetchedRegion)
              for (const dbVariant of regionDbVariants) {
                const fetchedVariant = fetchedVariants.find(({ variantId }) => variantId === dbVariant.variantId)
                if (!fetchedVariant) {
                  // NOTE: It was decided not to delete obsolete variants automatically
                  // If Marketing changes their mind this is the place to do it
                  await this.variantRepo.softDelete(dbVariant.id).then(() => result.updated.add(dbProduct.slug))
                  continue
                }
                const variantNeedsChanges =
                  ['price', 'variantName', 'sku'].some(k => dbVariant[k] != fetchedVariant[k]) ||
                  dbVariant.options.some(
                    dbOption =>
                      !fetchedVariant.options.find(
                        fOption => dbOption.name === fOption.name && dbOption.value === fOption.value
                      )
                  )

                if (variantNeedsChanges) {
                  const { price, variantName, sku, options } = fetchedVariant
                  await this.variantRepo
                    .save(patch(dbVariant, { price, variantName, sku, options }))
                    .then(() => result.updated.add(dbProduct.slug))
                }
              }
            })
        }
      })
      .then(() => result)
  }

  sortProducts(input: ObjectID[]): Promise<Product[]> {
    return Promise.all(
      input.map((id, order) => this.productRepo.update(id, { order }).then(() => this.productRepo.findOne(id)))
    )
  }

  async fakeAddVariant(slug: string): Promise<Variant> {
    const isos = Object.values(Language)
    const newProduct = patch(new Product(), { slug }) //, l10n: [] })

    const product = await this.productRepo.save(newProduct)

    const variant = patch(new Variant(), { product })

    variant.l10n = isos.map(iso =>
      patch(new ProductL10n(), {
        iso,
        section: L10nType.TITLE,
        value: [iso + slug + Math.floor(Math.random() * 100000).toString(16)],
      })
    )

    return this.variantRepo.save(variant)
  }

  async fakeAdd(slug: string): Promise<Product> {
    const isos = Object.values(Language)
    const l10n = toObjectKeys(Language, 'Screw')

    const product = patch(new Product(), {
      slug,
      inBox: [...Array(3)].map((num, i) =>
        patch(new ProductInBox(), {
          l10n,
          quantity: 10,
          thumbnail: `https://picsum.photos/seed/${i}/200/200`,
        })
      ),
      l10n: isos.map(iso =>
        patch(new ProductL10n(), {
          iso,
          section: L10nType.TITLE,
          value: [iso + slug + Math.floor(Math.random() * 100000).toString(16)],
        })
      ),
      media: [...Array(3)].map((num, i) =>
        patch(new ProductMedia(), {
          mediaType: 'image',
          source: `https://picsum.photos/seed/${i}/200/200`,
        })
      ),
    })

    const variant = patch(new Variant(), {
      region: Region.EU,
      sku: 'PAR',
      price: 1,
      variantName: slug,
      variantId: 'shopifyId',
      inBox: [],
      l10n: isos.map(iso =>
        patch(new ProductL10n(), {
          iso,
          section: L10nType.TITLE,
          value: [iso + slug + Math.floor(Math.random() * 100000).toString(16)],
        })
      ),
      media: [...Array(3)].map((num, i) =>
        patch(new ProductMedia(), {
          mediaType: MediaType.IMAGE,
          source: `https://picsum.photos/seed/${i}/200/200`,
        })
      ),
    })

    product.variants = [variant]
    return this.productRepo.save(product)
  }
}
