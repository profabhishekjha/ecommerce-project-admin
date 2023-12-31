// get-total-quantity.ts
import prismadb from "@/lib/prismadb";

export const getSalesCount = async () => {
  const total = await prismadb.totalQuantity.findFirst({
    where : {
        id: 1
    }
  });
  return total?.quantity ?? 0; 
};
