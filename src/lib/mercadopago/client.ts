import MercadoPagoConfig, { PreApproval } from "mercadopago";

let _mp: MercadoPagoConfig | null = null;

export function getMpConfig(): MercadoPagoConfig {
  if (!_mp) {
    _mp = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
  }
  return _mp;
}

export function getPreApprovalClient() {
  return new PreApproval(getMpConfig());
}
