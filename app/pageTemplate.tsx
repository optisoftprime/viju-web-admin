"use client";

import { useState } from "react";
import {
  Text,
  Card,
  Button,
  Modal,
  Input,
  Textarea,
  Select,
  Checkbox,
  Table,
} from "@/components/common";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    message: "",
    country: "",
    agree: false,
  });

  const tableData = [
    { id: 1, name: "Alice Johnson", role: "Designer", status: "Active" },
    { id: 2, name: "Bob Smith", role: "Developer", status: "Active" },
    { id: 3, name: "Carol White", role: "Manager", status: "Inactive" },
    { id: 4, name: "David Brown", role: "Developer", status: "Active" },
  ];

  const tableColumns = [
    { key: "id", title: "ID", sortable: true },
    { key: "name", title: "Name", sortable: true },
    { key: "role", title: "Role" },
    {
      key: "status",
      title: "Status",
      render: (value: string) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            value === "Active"
              ? "bg-orange/20 text-primary"
              : "bg-muted/20 text-muted"
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <Text variant="h1" color="primary" weight="bold">
            🎨 Enterprise UI Design System
          </Text>
          <Text variant="body" color="muted" className="mt-2">
            Complete reusable component library for Next.js
          </Text>
        </div>

        {/* Typography Section */}
        <Card title="Typography" subtitle="Text component with variants">
          <div className="space-y-4">
            <div>
              <Text variant="h1">Heading 1 (h1)</Text>
              <Text variant="body" color="muted" className="text-sm">
                font-bold, text-3xl
              </Text>
            </div>
            <div>
              <Text variant="h2">Heading 2 (h2)</Text>
              <Text variant="body" color="muted" className="text-sm">
                font-semibold, text-2xl
              </Text>
            </div>
            <div>
              <Text variant="h3">Heading 3 (h3)</Text>
              <Text variant="body" color="muted" className="text-sm">
                font-semibold, text-xl
              </Text>
            </div>
            <div>
              <Text variant="body">Body text (body)</Text>
              <Text variant="body" color="muted" className="text-sm">
                font-normal, text-base
              </Text>
            </div>
            <div>
              <Text variant="small" color="muted">
                Small text (small)
              </Text>
              <Text variant="caption" color="muted">
                Caption text (caption)
              </Text>
            </div>

            {/* Colors */}
            <div className="pt-4 space-y-2">
              <Text variant="body" color="foreground">
                Foreground color
              </Text>
              <Text variant="body" color="primary">
                Primary color
              </Text>
              <Text variant="body" color="secondary">
                Secondary color
              </Text>
              <Text variant="body" color="muted">
                Muted color
              </Text>
            </div>
          </div>
        </Card>

        {/* Buttons Section */}
        <Card title="Buttons" subtitle="Interactive button component">
          <div className="space-y-6">
            <div>
              <Text variant="small" color="muted" weight="semibold">
                Variants
              </Text>
              <div className="flex gap-3 flex-wrap mt-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="orange">Orange</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </div>

            <div>
              <Text variant="small" color="muted" weight="semibold">
                Sizes
              </Text>
              <div className="flex gap-3 items-center flex-wrap mt-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div>
              <Text variant="small" color="muted" weight="semibold">
                States
              </Text>
              <div className="flex gap-3 flex-wrap mt-3">
                <Button variant="primary">Default</Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
                <Button variant="primary" loading>
                  Loading
                </Button>
                <Button variant="primary" fullWidth>
                  Full Width
                </Button>
              </div>
            </div>

            <div>
              <Text variant="small" color="muted" weight="semibold">
                Gradient
              </Text>
              <div className="flex gap-3 flex-wrap mt-3">
                <Button variant="primary" gradient>
                  Gradient Primary
                </Button>
                <Button variant="secondary" gradient>
                  Gradient Secondary
                </Button>
                <Button variant="orange" gradient>
                  Gradient Orange
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Inputs Section */}
        <Card title="Form Inputs" subtitle="Input, Textarea, Select, Checkbox">
          <div className="space-y-6">
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="your@email.com"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Enter password"
              showPasswordToggle
            />

            <Textarea
              label="Message"
              name="message"
              value={formData.message}
              onChange={(value) => setFormData({ ...formData, message: value })}
              placeholder="Type your message here..."
              maxLength={200}
            />

            <Select
              label="Country"
              name="country"
              value={formData.country}
              onChange={(value) => setFormData({ ...formData, country: value })}
              options={[
                { value: "us", label: "United States" },
                { value: "uk", label: "United Kingdom" },
                { value: "ca", label: "Canada" },
                { value: "au", label: "Australia" },
              ]}
            />

            <Checkbox
              label="I agree to the terms and conditions"
              name="agree"
              checked={formData.agree}
              onChange={(checked) =>
                setFormData({ ...formData, agree: checked })
              }
            />
          </div>
        </Card>

        {/* Error States Section */}
        <Card title="Error States" subtitle="Validation error examples">
          <div className="space-y-6">
            <Input
              label="Invalid Email"
              name="invalid-email"
              type="email"
              error="Please enter a valid email address"
              placeholder="your@email.com"
            />

            <Textarea
              label="Required Field"
              name="required-textarea"
              error="This field is required"
              placeholder="Enter text..."
            />

            <Select
              label="Invalid Selection"
              name="invalid-select"
              options={[
                { value: "option1", label: "Option 1" },
                { value: "option2", label: "Option 2" },
              ]}
              error="Please select a valid option"
            />

            <Checkbox
              label="Must be accepted"
              name="required-checkbox"
              error="You must accept this agreement"
            />
          </div>
        </Card>

        {/* Modal Section */}
        <Card title="Modal" subtitle="Dialog component with overlay">
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open Modal
          </Button>

          <Modal
            open={modalOpen}
            title="Confirm Action"
            onClose={() => setModalOpen(false)}
            actions={
              <>
                <Button
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setModalOpen(false)}
                  fullWidth
                >
                  Confirm
                </Button>
              </>
            }
          >
            <Text variant="body" color="foreground">
              Are you sure you want to proceed with this action? This cannot be
              undone.
            </Text>
          </Modal>
        </Card>

        {/* Table Section */}
        <Card title="Table" subtitle="Data display with loading skeleton">
          <Table
            columns={tableColumns}
            data={tableData}
            onRowClick={(row) => console.log("Row clicked:", row)}
          />
        </Card>

        {/* Loading Table */}
        <Card title="Table Loading State" subtitle="Loading skeleton example">
          <Table columns={tableColumns} data={[]} loading={true} />
        </Card>

        {/* Design Tokens */}
        <Card title="Design Tokens" subtitle="Color palette used">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <div className="w-full h-24 bg-primary rounded-lg"></div>
              <Text variant="caption" color="muted" weight="semibold">
                Primary
              </Text>
            </div>
            <div className="space-y-2">
              <div className="w-full h-24 bg-secondary rounded-lg"></div>
              <Text variant="caption" color="muted" weight="semibold">
                Secondary
              </Text>
            </div>
            <div className="space-y-2">
              <div className="w-full h-24 bg-orange rounded-lg"></div>
              <Text variant="caption" color="muted" weight="semibold">
                Orange
              </Text>
            </div>
            <div className="space-y-2">
              <div className="w-full h-24 bg-milkwhite rounded-lg border border-muted"></div>
              <Text variant="caption" color="muted" weight="semibold">
                Milkwhite
              </Text>
            </div>
            <div className="space-y-2">
              <div className="w-full h-24 bg-muted rounded-lg"></div>
              <Text variant="caption" color="muted" weight="semibold">
                Muted
              </Text>
            </div>
            <div className="space-y-2">
              <div className="w-full h-24 bg-foreground rounded-lg"></div>
              <Text variant="caption" color="muted" weight="semibold">
                Foreground
              </Text>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-muted">
          <Text variant="small" color="muted">
            All components are production-ready and fully typed with TypeScript
          </Text>
        </div>
      </div>
    </div>
  );
}
