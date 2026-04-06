import { useCallback, useState } from 'react'
import { useVoteDetail } from '../user/useVoteDetail'
import { useVoteResult } from '../user/useVoteResult'

export function useVoteManage(id: string) {
  // TODO: 공개 투표(Open Tally)와 비공개 투표(Private Tally)에 따른 데이터 페칭 로직 분기
  // 1. 공개 투표인 경우:
  //    - 프론트엔드에서 바로 체인(스마트 컨트랙트)에 접근하여 모든 트랜잭션을 조회
  //    - 조회된 트랜잭션을 프론트엔드 로직으로 합산하여 현황 도출
  // 2. 비공개 투표인 경우:
  //    - 백엔드 API에 요청을 보내 백엔드에서 복호화 및 합산된 결과를 수신
  // 
  // * 두 경우 모두 최종 반환되는 데이터 형식은 동일해야 함.
  // * 현재는 프론트 체인 연결 로직 구현 전이므로 기존 Mock 데이터 훅을 활용.

  const { vote, isLoading: isVoteLoading } = useVoteDetail(id)
  const { result, isLoading: isResultLoading } = useVoteResult(id)
  
  const [isUpdating, setIsUpdating] = useState(false)

  const updateEndDate = useCallback(async (newEndDate: string) => {
    setIsUpdating(true)
    try {
      // TODO: 실제 스마트 컨트랙트에 투표 종료 일정 변경 트랜잭션 전송 또는 백엔드 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000)) // 네트워크 지연 시뮬레이션
      console.log(`End date updated to ${newEndDate}`)
      return true
    } catch (error) {
      console.error('Failed to update end date', error)
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [])

  return {
    vote,
    result,
    isLoading: isVoteLoading || isResultLoading,
    isUpdating,
    updateEndDate
  }
}
