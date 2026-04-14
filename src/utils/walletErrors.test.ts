import { describe, expect, it } from 'vitest'
import { getReadableWalletErrorMessage, getWalletActionErrorMessage } from './walletErrors'

describe('walletErrors', () => {
  it('extracts a readable revert reason from linea_estimateGas errors', () => {
    const error = new Error(`Missing or invalid parameters.
Double check you have provided the correct parameters.

URL: https://public.sepolia.rpc.status.network
Request body: {"method":"linea_estimateGas","params":[{"from":"0x1","to":"0x2","data":"0x438b32fb","value":"0x0"}]}

Details: Execution reverted (VESTAr: not finalized)
Version: viem@2.47.11`)

    expect(getReadableWalletErrorMessage(error)).toBe('VESTAr: not finalized')
    expect(
      getWalletActionErrorMessage(error, {
        lang: 'en',
        defaultMessage: 'Failed to check the fee status.',
      }),
    ).toBe('This action is not available yet because the election is not finalized.')
  })

  it('maps readable revert reasons to localized settlement copy', () => {
    const error = new Error(`Execution reverted (VESTAr: already settled)`)

    expect(getReadableWalletErrorMessage(error)).toBe('VESTAr: already settled')
    expect(
      getWalletActionErrorMessage(error, {
        lang: 'ko',
        defaultMessage: '수수료 상태를 확인하지 못했습니다.',
      }),
    ).toBe('이미 정산이 완료된 투표입니다.')
  })

  it('maps out-of-gas failures to a dedicated message', () => {
    const error = new Error('Transaction reverted on-chain: out of gas')

    expect(
      getWalletActionErrorMessage(error, {
        lang: 'en',
        defaultMessage: 'Failed to check the fee status.',
      }),
    ).toBe('The transaction ran out of gas during execution. Please try again.')
  })
})
