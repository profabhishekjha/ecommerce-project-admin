// get-total-quantity.ts
import prismadb from "@/lib/prismadb";

export const getTotalQuantity = async () => {
  const total = await prismadb.totalQuantity.findFirst({
    where : {
        id: 1
    }
  });
  console.log(total)
  return total?.quantity ?? 0; 
};
