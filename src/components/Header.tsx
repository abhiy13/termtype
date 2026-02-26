interface HeaderProps {
  fontColor?: string
  subtitleColor?: string
}

export function Header({ fontColor = "#E2B714", subtitleColor = "#646669" }: HeaderProps) {
  return (
    <box style={{ flexDirection: "column", alignItems: "center", gap: 0 }}>
      <text fg={fontColor}>{"╔╦╗┌─┐┬─┐┌┬┐╔╦╗┬ ┬┌─┐┌─┐"}</text>
      <text fg={fontColor}>{" ║ ├┤ ├┬┘│││ ║ └┬┘├─┘├┤ "}</text>
      <text fg={fontColor}>{" ╩ └─┘┴└─┴ ┴ ╩  ┴ ┴  └─┘"}</text>
      <text fg={subtitleColor}>terminal typing test</text>
    </box>
  )
}
