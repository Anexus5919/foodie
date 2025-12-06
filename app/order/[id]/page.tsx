import { Metadata } from "next";
import OrderClient from "./client";

export const metadata: Metadata = {
  title: "Track Order | Foodie",
  description: "Live order tracking",
};

export default async function OrderPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <OrderClient id={id} />;
}