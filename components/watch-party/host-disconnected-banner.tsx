type Props = {
  show: boolean;
};

export function HostDisconnectedBanner({ show }: Props) {
  if (!show) return null;

  return (
    <div className="w-full bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg text-sm text-center">
      호스트 연결이 끊겼습니다… 30초 내에 돌아오지 않으면 방이 종료됩니다.
    </div>
  );
}
