import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import styled, { createGlobalStyle } from 'styled-components'
import { Navbar } from './components/Navbar.tsx'
import { Page } from './components/Page.tsx'
import { CartPage } from './pages/CartPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'
import { SpaceDesignOptionsPage } from './pages/SpaceDesignOptionsPage.tsx'
import { UploadedSpacePage } from './pages/UploadedSpacePage.tsx'

const ProductDetailsPage = lazy(() =>
  import('./pages/ProductDetailsPage.tsx').then((module) => ({
    default: module.ProductDetailsPage,
  })),
)

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`

const Shell = styled.main`
  min-height: 100vh;
  margin: 0;
  padding: 48px 24px 64px;
  background: #f4f1ea;
  color: #1c1915;
  font-family: Georgia, 'Times New Roman', serif;
`

function App() {
  return (
    <>
      <GlobalStyle />
      <Navbar />
      <Shell>
        <Routes>
          <Route index element={<HomePage />} />
          <Route
            path="products/:productId"
            element={
              <Suspense fallback={null}>
                <ProductDetailsPage />
              </Suspense>
            }
          />
          <Route path="cart" element={<CartPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="orders" element={<Page title="Orders" />} />
          <Route path="space" element={<SpaceDesignOptionsPage />} />
          <Route path="space/my-design" element={<UploadedSpacePage />} />
          <Route path="*" element={<Page title="Page not found" />} />
        </Routes>
      </Shell>
    </>
  )
}

export default App
