import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { getManager, ObjectID, Repository } from 'typeorm'

import { patch } from 'src/utils/general'

import { Variant } from './entities/variant.entity'
import { UpdateVariantInput, UpdateVariantOfferInput } from './variants.dto'
import { ProductInBox, ProductL10n, ProductMedia } from 'src/products/entities/product-polymorphic.entity'
import { Offer } from './entities/offer.entity'
import { UpdateProductInBoxInput, UpdateProductL10nInput, UpdateProductMediaInput } from '../dto/products.dto'

@Injectable()
export class VariantsService {
  constructor(
    @InjectRepository(Variant)
    private variantRepo: Repository<Variant>,
    @InjectRepository(ProductMedia)
    private mediaRepo: Repository<ProductMedia>
  ) {}

  findAll(): Promise<Variant[]> {
    return this.variantRepo.find()
  }

  setVariantOutOfStock(id: ObjectID, outOfStock: boolean): Promise<Variant> {
    return this.variantRepo.update(id, { outOfStock }).then(() => this.variantRepo.findOne(id))
  }

  sortVariants(input: ObjectID[]): Promise<Variant[]> {
    return Promise.all(
      input.map((id, order) => this.variantRepo.update(id, { order }).then(() => this.variantRepo.findOne(id)))
    )
  }

  updateVariant(variantId: ObjectID, { variantName, price, outOfStock }: UpdateVariantInput): Promise<Variant> {
    return this.variantRepo.findOneOrFail(variantId).then(variant => {
      const patched = patch(variant, { variantName, price, outOfStock })
      return this.variantRepo.save(patched)
    })
  }

  updateVariantInbox(variantId: ObjectID, inBox: UpdateProductInBoxInput[]): Promise<ProductInBox[]> {
    return this.variantRepo.findOneOrFail(variantId, { relations: ['inBox'] }).then(async variant => {
      const newInBox = await Promise.all(inBox.map(UpdateProductInBoxInput.toEntity)).then(inBox =>
        inBox.map((content, order) => ({ ...content, order }))
      )

      await getManager().transaction(async manager => {
        variant.inBox.length && (await manager.delete(ProductInBox, variant.inBox))
        variant.inBox = newInBox
        await manager.save(variant)
      })

      return newInBox
    })
  }

  updateVariantL10n(variantId: ObjectID, l10n: [UpdateProductL10nInput]) {
    return this.variantRepo.findOneOrFail(variantId, { relations: ['l10n'] }).then(async variant => {
      const newL10n = await Promise.all(l10n.map(UpdateProductL10nInput.toEntity))
      await getManager().transaction(async manager => {
        variant.l10n.length && (await manager.delete(ProductL10n, variant.l10n))
        variant.l10n = newL10n
        await manager.save(variant)
      })
      return variant.l10n
    })
  }

  updateVariantMedia(variantId: ObjectID, media: UpdateProductMediaInput[]): Promise<ProductMedia[]> {
    return this.variantRepo.findOneOrFail(variantId, { relations: ['media'] }).then(async variant => {
      const newMedia = await Promise.all(media.map(UpdateProductMediaInput.toEntity))
      await getManager().transaction(async manager => {
        variant.media.length && (await manager.delete(ProductMedia, variant.media))
        variant.media = newMedia
        await manager.save(variant)
      })
      return variant.media
    })
  }

  updateVariantOffer(variantId: ObjectID, offers: UpdateVariantOfferInput[]): Promise<Offer[]> {
    return this.variantRepo.findOneOrFail(variantId, { relations: ['offers'] }).then(async variant => {
      const newOffers = await Promise.all(offers.map(UpdateVariantOfferInput.toEntity))

      await getManager().transaction(async manager => {
        variant.offers.length && (await manager.delete(Offer, variant.offers))
        variant.offers = newOffers
        await manager.save(variant)
      })

      return newOffers
    })
  }
}
