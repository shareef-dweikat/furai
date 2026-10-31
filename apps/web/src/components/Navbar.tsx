import { NavLink } from 'react-router'
import styled from 'styled-components'
import { useCartStore } from '../stores/use-cart-store.ts'
import { useProfileStore } from '../stores/use-profile-store.ts'

const baseNavItems = [
  { to: '/cart', label: 'Cart' },
  { to: '/orders', label: 'Orders' },
  { to: '/', label: 'Home' },
  { to: '/space', label: 'Space design tool' },
] as const

const Bar = styled.header`
  border-bottom: 1px solid #e4ddd2;
  background: #fffcf7;
`

const Nav = styled.nav`
  width: min(880px, 100%);
  margin: 0 auto;
  padding: 0 24px;
`

const List = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
  padding: 10px 0;
  list-style: none;
`

const Tab = styled(NavLink)`
  border: 0;
  border-radius: 999px;
  padding: 8px 14px;
  background: transparent;
  color: #3f382f;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: #efe8dc;
  }

  &.active {
    background: #1c1915;
    color: #f7f3ec;
  }

  &.active:hover {
    background: #3a332c;
  }

  &:focus-visible {
    outline: 2px solid #1c1915;
    outline-offset: 3px;
  }
`

export function Navbar() {
  const lineCount = useCartStore((state) => state.items.length)
  const isSignedIn = useProfileStore((state) => state.isSignedIn)

  const navItems = [
    ...baseNavItems,
    ...(isSignedIn ? [{ to: '/profile', label: 'Profile' }] : []),
  ]

  return (
    <Bar>
      <Nav aria-label="Primary">
        <List>
          {navItems.map((item) => (
            <li key={item.to}>
              <Tab to={item.to} end>
                {item.to === '/cart' && lineCount > 0
                  ? `${item.label} (${lineCount})`
                  : item.label}
              </Tab>
            </li>
          ))}
        </List>
      </Nav>
    </Bar>
  )
}
