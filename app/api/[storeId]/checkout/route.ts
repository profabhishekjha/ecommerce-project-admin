import Stripe from "stripe";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const { productIds, quantities } = await req.json();

  if (!productIds || productIds.length === 0) {
    return new NextResponse("Product ids are required", { status: 400 });
  }

  if (!quantities || quantities.length === 0) {
    return new NextResponse("Quantities are required", { status: 400 });
  }

  if (productIds.length !== quantities.length) {
    return new NextResponse("Mismatch between product IDs and quantities", {
      status: 400,
    });
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (let i = 0; i < productIds.length; i++) {
    const productId = productIds[i];
    const quantity = quantities[i]; // Use the corresponding quantity

    const product = await prismadb.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return new NextResponse(`Product not found for ID: ${productId}`, {
        status: 400,
      });
    }

    line_items.push({
      quantity: quantities[i], // Use the corresponding quantity here
      price_data: {
        currency: "INR",
        product_data: {
          name: product.name,
        },
        unit_amount: product.price.toNumber() * 100,
      },
    });
  }

  const order = await prismadb.order.create({
    data: {
      storeId: params.storeId,
      isPaid: false,
      orderItems: {
        create: productIds.map((productId: string, i: number) => ({
          quantity: quantities[i], // Use the corresponding quantity here
          product: {
            connect: {
              id: productId,
            },
          },
        })),
      },
    },
  });

  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    billing_address_collection: "required",
    phone_number_collection: {
      enabled: true,
    },
    success_url: `${process.env.FRONTEND_STORE_URL}/cart?success=1`,
    cancel_url: `${process.env.FRONTEND_STORE_URL}/cart?canceled=1`,
    metadata: {
      orderId: order.id,
    },
  });

  return NextResponse.json(
    { url: session.url },
    {
      headers: corsHeaders,
    }
  );
}
